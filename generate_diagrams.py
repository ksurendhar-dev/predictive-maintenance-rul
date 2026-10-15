import matplotlib.pyplot as plt
import matplotlib.patches as patches

# --- Figure 4.2: Class Diagram ---
def create_class_diagram():
    fig, ax = plt.subplots(figsize=(10, 11), dpi=200)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Box 1: Machine
    # Header: Machine
    m_x, m_y, m_w, m_h = 8, 54, 38, 38
    r_m = patches.Rectangle((m_x, m_y), m_w, m_h, edgecolor='black', facecolor='white', linewidth=1.2)
    ax.add_patch(r_m)
    ax.plot([m_x, m_x+m_w], [m_y+m_h-6, m_y+m_h-6], color='black', lw=1.2)
    ax.text(m_x + m_w/2, m_y + m_h - 3.8, 'Machine', ha='center', va='center', fontsize=11, fontweight='bold', family='serif')
    
    m_fields = [
        "+ObjectId _id",
        "+String machineId",
        "+String name",
        "+String type",
        "+String line",
        "+Number currentVibrationRms",
        "+Number currentBearingPeakG",
        "+Number currentTempC",
        "+Number healthScore",
        "+String status",
        "+Number predictedRulHours",
        "+Number rulConfidenceMin",
        "+Number rulConfidenceMax"
    ]
    cur_y = m_y + m_h - 9
    for f in m_fields:
        ax.text(m_x + 2, cur_y, f, ha='left', va='center', fontsize=7.5, family='serif')
        cur_y -= 2.2

    # Box 2: TelemetryReading
    t_x, t_y, t_w, t_h = 56, 54, 36, 38
    r_t = patches.Rectangle((t_x, t_y), t_w, t_h, edgecolor='black', facecolor='white', linewidth=1.2)
    ax.add_patch(r_t)
    ax.plot([t_x, t_x+t_w], [t_y+t_h-6, t_y+t_h-6], color='black', lw=1.2)
    ax.text(t_x + t_w/2, t_y + t_h - 3.8, 'TelemetryReading', ha='center', va='center', fontsize=11, fontweight='bold', family='serif')

    t_fields = [
        "+ObjectId _id",
        "+String machineId",
        "+Date timestamp",
        "+Number vibrationRms",
        "+Number bearingPeakG",
        "+Number tempC",
        "+Number acousticEmissionDb",
        "+Number motorCurrentAmps",
        "+Number rpm",
        "+Boolean anomalyFlag"
    ]
    cur_y = t_y + t_h - 9
    for f in t_fields:
        ax.text(t_x + 2, cur_y, f, ha='left', va='center', fontsize=7.5, family='serif')
        cur_y -= 2.5

    # Box 3: AnomalyAlert
    a_x, a_y, a_w, a_h = 8, 8, 38, 36
    r_a = patches.Rectangle((a_x, a_y), a_w, a_h, edgecolor='black', facecolor='white', linewidth=1.2)
    ax.add_patch(r_a)
    ax.plot([a_x, a_x+a_w], [a_y+a_h-6, a_y+a_h-6], color='black', lw=1.2)
    ax.text(a_x + a_w/2, a_y + a_h - 3.8, 'AnomalyAlert', ha='center', va='center', fontsize=11, fontweight='bold', family='serif')

    a_fields = [
        "+ObjectId _id",
        "+String alertId",
        "+String machineId",
        "+String machineName",
        "+String severity",
        "+String failureMode",
        "+Number anomalyScore",
        "+Array explainability",
        "+String recommendedAction",
        "+String status",
        "+Date resolvedAt"
    ]
    cur_y = a_y + a_h - 9
    for f in a_fields:
        ax.text(a_x + 2, cur_y, f, ha='left', va='center', fontsize=7.5, family='serif')
        cur_y -= 2.4

    # Box 4: MaintenanceAction
    w_x, w_y, w_w, w_h = 56, 8, 36, 36
    r_w = patches.Rectangle((w_x, w_y), w_w, w_h, edgecolor='black', facecolor='white', linewidth=1.2)
    ax.add_patch(r_w)
    ax.plot([w_x, w_x+w_w], [w_y+w_h-6, w_y+w_h-6], color='black', lw=1.2)
    ax.text(w_x + w_w/2, w_y + w_h - 3.8, 'MaintenanceAction', ha='center', va='center', fontsize=11, fontweight='bold', family='serif')

    w_fields = [
        "+ObjectId _id",
        "+String actionId",
        "+String machineId",
        "+String title",
        "+String priority",
        "+String assignedTeam",
        "+Date scheduledDate",
        "+Number estimatedDowntimeHours",
        "+Array partsRequired",
        "+String status"
    ]
    cur_y = w_y + w_h - 9
    for f in w_fields:
        ax.text(w_x + 2, cur_y, f, ha='left', va='center', fontsize=7.5, family='serif')
        cur_y -= 2.5

    # Relationships & Arrows
    # Machine -> TelemetryReading (1 to *)
    ax.annotate('', xy=(56, 73), xytext=(46, 73), arrowprops=dict(arrowstyle='->', lw=1.2, color='black'))
    ax.text(46.5, 74.5, '1', fontsize=9, family='serif')
    ax.text(54.5, 74.5, '*', fontsize=9, family='serif')
    ax.text(51, 71, 'logs', ha='center', va='top', fontsize=8, family='serif', style='italic')

    # Machine -> AnomalyAlert (1 to *)
    ax.annotate('', xy=(27, 44), xytext=(27, 54), arrowprops=dict(arrowstyle='->', lw=1.2, color='black'))
    ax.text(28.5, 52, '1', fontsize=9, family='serif')
    ax.text(28.5, 45, '*', fontsize=9, family='serif')
    ax.text(22, 49, 'triggers', ha='center', va='center', fontsize=8, family='serif', style='italic')

    # Machine -> MaintenanceAction (1 to *)
    ax.plot([27, 27, 74, 74], [54, 49, 49, 44], color='black', lw=1.2)
    ax.annotate('', xy=(74, 44), xytext=(74, 49), arrowprops=dict(arrowstyle='->', lw=1.2, color='black'))
    ax.text(75.5, 45, '*', fontsize=9, family='serif')
    ax.text(50, 50.5, 'schedules maintenance', ha='center', va='bottom', fontsize=8, family='serif', style='italic')

    # AnomalyAlert -> MaintenanceAction (1 to 1 optional)
    ax.annotate('', xy=(56, 25), xytext=(46, 25), arrowprops=dict(arrowstyle='->', lw=1.2, color='black', linestyle='--'))
    ax.text(51, 26.5, 'dispatches', ha='center', va='bottom', fontsize=8, family='serif', style='italic')

    plt.tight_layout()
    plt.savefig('assets_report/fig_4_2_class_diagram.png', bbox_inches='tight', dpi=200)
    plt.close()
    print('Class diagram saved.')

# --- Figure 4.3: Sequence Diagram ---
def create_sequence_diagram():
    fig, ax = plt.subplots(figsize=(11, 10), dpi=200)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    lifelines = [
        ('Telemetry\nSimulator', 12),
        ('React\nFrontend', 28),
        ('Express\nServer', 46),
        ('Prognostics\nEngine', 64),
        ('MongoDB\nDatabase', 80),
        ('Socket.io\nHub', 94)
    ]

    for name, x in lifelines:
        # Box at top
        r = patches.FancyBboxPatch((x-6, 91), 12, 7, boxstyle='round,pad=0.2', edgecolor='black', facecolor='#f0f0f0', linewidth=1)
        ax.add_patch(r)
        ax.text(x, 94.5, name, ha='center', va='center', fontsize=7.5, fontweight='bold', family='serif')
        # Dashed lifeline
        ax.plot([x, x], [10, 91], color='gray', linestyle='--', linewidth=0.8)
        # Box at bottom
        r_bot = patches.FancyBboxPatch((x-6, 3), 12, 7, boxstyle='round,pad=0.2', edgecolor='black', facecolor='#f0f0f0', linewidth=1)
        ax.add_patch(r_bot)
        ax.text(x, 6.5, name, ha='center', va='center', fontsize=7.5, fontweight='bold', family='serif')

    messages = [
        (12, 46, 85, '1. POST /api/telemetry (Vibration RMS 8.6 mm/s)', '->', 'solid'),
        (46, 64, 78, '2. Evaluate ISO 10816 Threshold & Weibull RUL', '->', 'solid'),
        (64, 46, 72, '3. Critical Anomaly Flagged (RUL: 24h, Score: 0.94)', '->', 'dashed'),
        (46, 80, 66, '4. Persist TelemetryReading & AnomalyAlert', '->', 'solid'),
        (80, 46, 60, '5. Document Saved Confirmation', '->', 'dashed'),
        (46, 94, 54, '6. Emit "machine:update" & "alert:new"', '->', 'solid'),
        (94, 28, 48, '7. WebSocket Event Broadcast (Auto-focus Spline Wave)', '->', 'solid'),
        (28, 46, 40, '8. Plant Engineer clicks "1-Click Resolve" (PATCH /alerts/:id/resolve)', '->', 'solid'),
        (46, 80, 34, '9. Restore Nominal Baselines (1.8 mm/s, Health 96%)', '->', 'solid'),
        (80, 46, 28, '10. Baseline Restored Acknowledgment', '->', 'dashed'),
        (46, 94, 22, '11. Broadcast "machine:update" (Health Restored)', '->', 'solid'),
        (94, 28, 16, '12. UI Returns to STABLE Green Baseline', '->', 'solid')
    ]

    for x_from, x_to, y, text, arrow, style in messages:
        ls = '-' if style == 'solid' else '--'
        ax.annotate('', xy=(x_to, y), xytext=(x_from, y),
                    arrowprops=dict(arrowstyle=arrow, lw=1.1, color='black', linestyle=ls))
        mid_x = (x_from + x_to) / 2
        ax.text(mid_x, y + 1.2, text, ha='center', va='bottom', fontsize=7.5, family='serif')

    plt.tight_layout()
    plt.savefig('assets_report/fig_4_3_sequence_diagram.png', bbox_inches='tight', dpi=200)
    plt.close()
    print('Sequence diagram saved.')

create_class_diagram()
create_sequence_diagram()
