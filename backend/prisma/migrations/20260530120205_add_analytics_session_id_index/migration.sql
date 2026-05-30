-- DropIndex
DROP INDEX "analytics_events_entityId_idx";

-- DropIndex
DROP INDEX "analytics_events_eventType_idx";

-- DropIndex
DROP INDEX "analytics_events_timestamp_idx";

-- DropIndex
DROP INDEX "audit_logs_adminUserId_idx";

-- DropIndex
DROP INDEX "audit_logs_entityType_entityId_idx";

-- DropIndex
DROP INDEX "audit_logs_timestamp_idx";

-- DropIndex
DROP INDEX "rate_limits_key_idx";

-- DropIndex
DROP INDEX "rate_limits_timestamp_idx";

-- CreateIndex
CREATE INDEX "analytics_events_eventType_entityId_timestamp_idx" ON "analytics_events"("eventType", "entityId", "timestamp");

-- CreateIndex
CREATE INDEX "analytics_events_sessionId_idx" ON "analytics_events"("sessionId");
