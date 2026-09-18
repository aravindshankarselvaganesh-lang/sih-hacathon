class WorkerBadge {
  final String workerCode;
  final String workerName;
  final String department;
  final String badgeUid;
  final String batchLot;

  static final RegExp _workerCodeRegExp = RegExp(r'^WRK-\d{3,10}$');
  static final RegExp _badgeUidRegExp = RegExp(r'^BDG-[A-Za-z0-9-]{2,32}$');
  static final RegExp _lotRegExp = RegExp(r'^LOT-[A-Za-z0-9-]{1,32}$');

  const WorkerBadge({
    required this.workerCode,
    required this.workerName,
    required this.department,
    required this.badgeUid,
    required this.batchLot,
  });

  /// Stable deterministic hash (sum of code units) — platform-independent,
  /// unlike [Object.hashCode] which is not stable across runs/VMs.
  static int stableHash(String input) {
    var sum = 0;
    for (final unit in input.codeUnits) {
      sum = (sum + unit) % 100000;
    }
    return sum;
  }

  factory WorkerBadge.fromDataMatrix(String payload) {
    // Format: "WRK-1024|BDG-7749-X|LOT-2026"
    final parts = payload.split('|');
    if (parts.length >= 2) {
      final workerCode = parts[0].trim();
      final badgeUid = parts[1].trim();
      final batchLot = parts.length > 2 ? parts[2].trim() : 'LOT-2026-A';
      if (!_workerCodeRegExp.hasMatch(workerCode)) {
        throw FormatException('Invalid workerCode: $workerCode');
      }
      if (!_badgeUidRegExp.hasMatch(badgeUid)) {
        throw FormatException('Invalid badgeUid: $badgeUid');
      }
      if (!_lotRegExp.hasMatch(batchLot)) {
        throw FormatException('Invalid batchLot: $batchLot');
      }
      return WorkerBadge(
        workerCode: workerCode,
        badgeUid: badgeUid,
        batchLot: batchLot,
        workerName: 'Worker $workerCode',
        department: 'Refinery Processing Unit',
      );
    }
    // Fail loudly on garbage instead of inventing a badge from hashCode.
    // Use [tryParseDataMatrix] if a nullable result is preferred.
    throw FormatException('Invalid DataMatrix payload: $payload');
  }

  /// Nullable variant: returns null instead of throwing on invalid payload.
  static WorkerBadge? tryParseDataMatrix(String payload) {
    try {
      return WorkerBadge.fromDataMatrix(payload);
    } on FormatException {
      return null;
    }
  }

  /// Legacy fallback badge for unparseable scans (stable hash, strict shape).
  factory WorkerBadge.fallbackBadge(String payload) {
    final stable = stableHash(payload).toString().padLeft(4, '0');
    return WorkerBadge(
      workerCode: 'WRK-UNKNOWN',
      badgeUid: 'BDG-$stable',
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
