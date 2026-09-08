import '../models/worker_badge.dart';

class BarcodeService {
  /// Parses raw scan string from MobileScanner / ZXing camera stream.
  /// Standard DataMatrix payload: 'WRK-1024|BDG-7749-X|LOT-2026'
  static WorkerBadge? parseBarcode(String? rawValue) {
    if (rawValue == null || rawValue.trim().isEmpty) return null;
    return WorkerBadge.fromDataMatrix(rawValue.trim());
  }

  /// Default demo worker badges for testing and plant simulation
  static List<WorkerBadge> getDemoBadges() {
    return [
      const WorkerBadge(
        workerCode: 'WRK-1024',
        workerName: 'Rahul Sharma',
        department: 'Hydrocracker Processing Unit',
        badgeUid: 'BDG-7749-A',
        batchLot: 'LOT-2026-03',
      ),
      const WorkerBadge(
        workerCode: 'WRK-2048',
        workerName: 'Priya Singh',
        department: 'Sulfur Recovery Unit (SRU)',
        badgeUid: 'BDG-8812-B',
        batchLot: 'LOT-2026-03',
      ),
      const WorkerBadge(
        workerCode: 'WRK-3072',
        workerName: 'Aman Kumar',
        department: 'Flare Gas Recovery',
        badgeUid: 'BDG-9901-C',
        batchLot: 'LOT-2026-02',
      ),
    ];
  }
}
