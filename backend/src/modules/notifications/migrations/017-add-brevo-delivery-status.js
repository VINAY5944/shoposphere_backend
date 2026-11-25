import { DataTypes } from "sequelize";

const expandedStatuses =
  "status IN ('QUEUED', 'RETRYING', 'ACCEPTED', 'SENT', 'DELIVERED', 'DEFERRED', 'BOUNCED', 'BLOCKED', 'INVALID_EMAIL', 'SPAM', 'DELIVERY_ERROR', 'FAILED', 'QUEUE_FAILED', 'SUPERSEDED')";
const previousStatuses =
  "status IN ('QUEUED', 'RETRYING', 'SENT', 'FAILED', 'QUEUE_FAILED', 'SUPERSEDED')";

export async function up({ context: queryInterface }) {
  await queryInterface.removeConstraint(
    "notifications",
    "chk_notifications_status"
  );

  await queryInterface.addColumn("notifications", "accepted_at", {
    type: DataTypes.DATE,
    allowNull: true,
  });
  await queryInterface.addColumn("notifications", "delivered_at", {
    type: DataTypes.DATE,
    allowNull: true,
  });
  await queryInterface.addColumn("notifications", "provider_message_id", {
    type: DataTypes.STRING(255),
    allowNull: true,
  });
  await queryInterface.addColumn("notifications", "provider_event", {
    type: DataTypes.STRING(50),
    allowNull: true,
  });
  await queryInterface.addColumn("notifications", "provider_reason", {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  await queryInterface.addColumn("notifications", "provider_event_at", {
    type: DataTypes.DATE,
    allowNull: true,
  });

  await queryInterface.addIndex("notifications", ["provider_message_id"], {
    name: "idx_notifications_provider_message_id",
  });

  await queryInterface.sequelize.query(`
    UPDATE notifications
    SET status = 'ACCEPTED',
        accepted_at = sent_at,
        sent_at = NULL
    WHERE status = 'SENT'
  `);

  await queryInterface.addConstraint("notifications", {
    fields: ["status"],
    type: "check",
    where: queryInterface.sequelize.literal(expandedStatuses),
    name: "chk_notifications_status",
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeConstraint(
    "notifications",
    "chk_notifications_status"
  );

  await queryInterface.sequelize.query(`
    UPDATE notifications
    SET status = CASE
          WHEN status IN ('ACCEPTED', 'DELIVERED', 'SENT') THEN 'SENT'
          WHEN status IN ('DEFERRED', 'BOUNCED', 'BLOCKED', 'INVALID_EMAIL', 'SPAM', 'DELIVERY_ERROR') THEN 'FAILED'
          ELSE status
        END,
        sent_at = COALESCE(sent_at, accepted_at)
  `);

  await queryInterface.addConstraint("notifications", {
    fields: ["status"],
    type: "check",
    where: queryInterface.sequelize.literal(previousStatuses),
    name: "chk_notifications_status",
  });

  await queryInterface.removeIndex(
    "notifications",
    "idx_notifications_provider_message_id"
  );
  await queryInterface.removeColumn("notifications", "provider_event_at");
  await queryInterface.removeColumn("notifications", "provider_reason");
  await queryInterface.removeColumn("notifications", "provider_event");
  await queryInterface.removeColumn(
    "notifications",
    "provider_message_id"
  );
  await queryInterface.removeColumn("notifications", "delivered_at");
  await queryInterface.removeColumn("notifications", "accepted_at");
}
