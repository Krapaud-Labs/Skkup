CREATE INDEX "watch_sessions_userId_dernierHeartbeatAt_idx"
ON "watch_sessions"("userId", "dernierHeartbeatAt");

CREATE INDEX "points_transactions_userId_createdAt_idx"
ON "points_transactions"("userId", "createdAt");
