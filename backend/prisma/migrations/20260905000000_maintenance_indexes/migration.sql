CREATE INDEX "oauth_states_consumedAt_idx" ON "oauth_states"("consumedAt");

CREATE INDEX "extension_pairing_tokens_expireAt_idx" ON "extension_pairing_tokens"("expireAt");

CREATE INDEX "extension_pairing_tokens_consommeAt_idx" ON "extension_pairing_tokens"("consommeAt");

CREATE INDEX "watch_sessions_statut_dernierHeartbeatAt_idx" ON "watch_sessions"("statut", "dernierHeartbeatAt");
