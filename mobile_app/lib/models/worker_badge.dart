class WorkerBadge {
  final String workerCode;
  final String workerName;
  final String department;
  final String badgeUid;
  final String batchLot;

  const WorkerBadge({
    required this.workerCode,
    required this.workerName,
    required this.department,
    required this.badgeUid,
    required this.batchLot,
  });

  factory WorkerBadge.fromDataMatrix(String payload) {
    // Format: "WRK-1024|BDG-7749-X|LOT-2026"
    final parts = payload.split('|');
    if (parts.length >= 2) {
      return WorkerBadge(
        workerCode: parts[0].trim(),
        badgeUid: parts[1].trim(),
        batchLot: parts.length > 2 ? parts[2].trim() : 'LOT-2026-A',
        workerName: 'Worker ${parts[0].trim()}',
        department: 'Refinery Processing Unit',
      );
    }
    return WorkerBadge(
      workerCode: payload.length > 8 ? payload.substring(0, 8) : payload,
      badgeUid: 'BDG-${payload.hashCode.abs() % 10000}',
      batchLot: 'LOT-2026-A',
      workerName: 'Refinery Personnel',
      department: 'Crude Distillation',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'worker_code': workerCode,
      'worker_name': workerName,
      'department': department,
      'badge_uid': badgeUid,
      'batch_lot': batchLot,
    };
  }
}
