import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { FleetOverview } from './pages/FleetOverview';
import { MachineDiagnostics } from './pages/MachineDiagnostics';
import { RULPredictions } from './pages/RULPredictions';
import { AnomalyAlerts } from './pages/AnomalyAlerts';
import { WorkOrders } from './pages/WorkOrders';
import { TelemetryTrends } from './pages/TelemetryTrends';
import { WorkOrderModal } from './components/WorkOrderModal';
import { AnomalyExplainModal } from './components/AnomalyExplainModal';
import { api } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [overview, setOverview] = useState(null);
  const [machines, setMachines] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [telemetryStream, setTelemetryStream] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  // Modals
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [preselectedMachineId, setPreselectedMachineId] = useState(null);
  const [alertForExplanation, setAlertForExplanation] = useState(null);

  const loadData = async () => {
    try {
      const [ovRes, mchRes, altRes, woRes] = await Promise.all([
        api.getOverview(),
        api.getMachines(),
        api.getAlerts(),
        api.getWorkOrders()
      ]);

      if (ovRes.success) setOverview(ovRes.data);
      if (mchRes.success) setMachines(mchRes.data);
      if (altRes.success) setAlerts(altRes.data);
      if (woRes.success) setWorkOrders(woRes.data);
    } catch (err) {
      console.error('Error loading predictive maintenance data:', err);
    }
  };

  useEffect(() => {
    loadData();

    // Setup Socket.IO connection
    const socketUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '') || '/';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('telemetry:stream', (data) => {
      if (data?.machineId && data?.telemetry) {
        setTelemetryStream(prev => {
          const current = prev[data.machineId] || [];
          const updated = [...current, data.telemetry].slice(-25);
          return { ...prev, [data.machineId]: updated };
        });
      }
      if (data?.machine) {
        setMachines(prev => prev.map(m => m.machineId === data.machine.machineId ? data.machine : m));
      }
    });

    socket.on('machine:update', (updatedMachine) => {
      setMachines(prev => prev.map(m => m.machineId === updatedMachine.machineId ? updatedMachine : m));
    });

    socket.on('alert:new', (newAlert) => {
      setAlerts(prev => {
        if (prev.some(a => a.alertId === newAlert.alertId)) return prev;
        return [newAlert, ...prev];
      });
    });

    socket.on('alert:acknowledged', (ackAlert) => {
      setAlerts(prev => prev.map(a => a.alertId === ackAlert.alertId ? ackAlert : a));
    });

    socket.on('alert:resolved', (resAlert) => {
      setAlerts(prev => prev.map(a => a.alertId === resAlert.alertId ? resAlert : a));
      api.getOverview().then(res => { if (res.success) setOverview(res.data); });
    });

    socket.on('work-order:new', (newWo) => {
      setWorkOrders(prev => [newWo, ...prev]);
    });

    socket.on('work-order:completed', (compWo) => {
      setWorkOrders(prev => prev.map(wo => wo.workOrderId === compWo.workOrderId ? compWo : wo));
    });

    socket.on('overview:update', (newOverview) => {
      setOverview(newOverview);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('telemetry:stream');
      socket.off('machine:update');
      socket.off('alert:new');
      socket.off('alert:acknowledged');
      socket.off('alert:resolved');
      socket.off('work-order:new');
      socket.off('work-order:completed');
      socket.off('overview:update');
      socket.disconnect();
    };
  }, []);

  // Handlers
  const handleTriggerScenario = async (scenarioKey) => {
    const res = await api.triggerScenario(scenarioKey);
    if (res.success && res.data) {
      setMachines(res.data.machines);
      setAlerts(res.data.alerts);
      const ovRes = await api.getOverview();
      if (ovRes.success) setOverview(ovRes.data);
    }
    return res;
  };

  const handleAcknowledgeAlert = async (alertId) => {
    const res = await api.acknowledgeAlert(alertId);
    if (res.success) {
      setAlerts(prev => prev.map(a => a.alertId === alertId ? res.data : a));
    }
  };

  const handleResolveAlert = async (alertId) => {
    const res = await api.resolveAlert(alertId);
    if (res.success) {
      setAlerts(prev => prev.map(a => a.alertId === alertId ? res.data : a));
      if (res.machine) {
        setMachines(prev => prev.map(m => m.machineId === res.machine.machineId ? res.machine : m));
      } else {
        const mRes = await api.getMachines();
        if (mRes.success) setMachines(mRes.data);
      }
      const ovRes = await api.getOverview();
      if (ovRes.success) setOverview(ovRes.data);
    }
  };

  const handleCreateWorkOrder = async (formData) => {
    const res = await api.createWorkOrder(formData);
    if (res.success) {
      setWorkOrders(prev => [res.data, ...prev]);
      loadData();
    }
  };

  const handleUpdateWorkOrderStatus = async (workOrderId, status) => {
    if (status === 'COMPLETED') {
      const res = await api.completeWorkOrder(workOrderId);
      if (res.success) {
        setWorkOrders(prev => prev.map(wo => wo.workOrderId === workOrderId ? res.data : wo));
        if (res.machine) {
          setMachines(prev => prev.map(m => m.machineId === res.machine.machineId ? res.machine : m));
        }
        loadData();
      }
    } else {
      const res = await api.updateWorkOrder(workOrderId, { status });
      if (res.success) {
        setWorkOrders(prev => prev.map(wo => wo.workOrderId === workOrderId ? res.data : wo));
        loadData();
      }
    }
  };

  const openWorkOrderWithMachine = (machineId) => {
    setPreselectedMachineId(machineId);
    setShowWorkOrderModal(true);
  };

  const activeAlertCount = alerts.filter(a => a.status !== 'RESOLVED').length;
  const criticalRulCount = machines.filter(m => m.predictedRulHours <= 200).length;

  return (
    <div className="app-container">
      <Sidebar 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        alertCount={activeAlertCount}
        criticalRulCount={criticalRulCount}
      />

      <div className="main-wrapper">
        <Header 
          title={
            currentTab === 'dashboard' ? 'Equipment Overview' :
            currentTab === 'machines' ? 'Machine Status' :
            currentTab === 'rul' ? 'Remaining Machine Life' :
            currentTab === 'alerts' ? 'Equipment Alerts' :
            currentTab === 'workorders' ? 'Repairs & Maintenance Tasks' :
            'Live Sensor Charts'
          }
          onOpenWorkOrderModal={() => setShowWorkOrderModal(true)}
        />

        <main className="content-body">
          {currentTab === 'dashboard' && (
            <FleetOverview 
              overview={overview}
              machines={machines}
              alerts={alerts}
              telemetryStream={telemetryStream}
              onExplainAlert={alert => setAlertForExplanation(alert)}
              onOpenWorkOrderModal={openWorkOrderWithMachine}
              onResolveAlert={handleResolveAlert}
              onTriggerScenario={handleTriggerScenario}
              isConnected={isConnected}
            />
          )}

          {currentTab === 'machines' && (
            <MachineDiagnostics 
              machines={machines}
              onOpenWorkOrderModal={openWorkOrderWithMachine}
            />
          )}

          {currentTab === 'rul' && (
            <RULPredictions 
              machines={machines}
              onOpenWorkOrderModal={openWorkOrderWithMachine}
            />
          )}

          {currentTab === 'alerts' && (
            <AnomalyAlerts 
              alerts={alerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onResolveAlert={handleResolveAlert}
              onExplainAlert={alert => setAlertForExplanation(alert)}
            />
          )}

          {currentTab === 'workorders' && (
            <WorkOrders 
              workOrders={workOrders}
              onUpdateWorkOrderStatus={handleUpdateWorkOrderStatus}
              onOpenWorkOrderModal={() => setShowWorkOrderModal(true)}
            />
          )}

          {currentTab === 'trends' && (
            <TelemetryTrends machines={machines} />
          )}
        </main>
      </div>

      {showWorkOrderModal && (
        <WorkOrderModal 
          machines={machines}
          preselectedMachineId={preselectedMachineId}
          onClose={() => {
            setShowWorkOrderModal(false);
            setPreselectedMachineId(null);
          }}
          onSubmit={handleCreateWorkOrder}
        />
      )}

      {alertForExplanation && (
        <AnomalyExplainModal 
          alert={alertForExplanation}
          onClose={() => setAlertForExplanation(null)}
          onDispatchWorkOrder={alert => openWorkOrderWithMachine(alert.machineId)}
        />
      )}
    </div>
  );
}
