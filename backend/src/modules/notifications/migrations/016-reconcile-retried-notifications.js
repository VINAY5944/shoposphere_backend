const updatedStatuses =
  "status IN ('QUEUED', 'RETRYING', 'SENT', 'FAILED', 'QUEUE_FAILED', 'SUPERSEDED')";
const existingStatuses =
  "status IN ('QUEUED', 'RETRYING', 'SENT', 'FAILED', 'QUEUE_FAILED')";

export async function up({ context: queryInterface }) {
  await queryInterface.removeConstraint(
    "notifications",
    "chk_notifications_status"
  );
  await queryInterface.addConstraint("notifications", {
    fields: ["status"],
    type: "check",
    where: queryInterface.sequelize.literal(updatedStatuses),
    name: "chk_notifications_status",
  });

  await queryInterface.sequelize.query(`
    UPDATE notifications AS original
    SET
      status = retried.status,
      latest_queue_job_id = retried.latest_queue_job_id,
      attempts_made = retried.attempts_made,
      retry_count = failed.retry_count,
      error_message = retried.error_message,
      sent_at = retried.sent_at,
      failed_at = retried.failed_at,
      last_retried_at = failed.last_retried_at,
      updated_at = NOW()
    FROM notification_failed_jobs AS failed
    JOIN notifications AS retried
      ON retried.original_job_id = failed.latest_queue_job_id
    WHERE failed.notification_id = original.id
      AND retried.id <> original.id
      AND original.latest_queue_job_id = retried.original_job_id
      AND original.status = 'RETRYING'
      AND failed.status IN ('FAILED', 'RETRYING', 'RESOLVED')
  `);

  await queryInterface.sequelize.query(`
    UPDATE notifications AS retried
    SET status = 'SUPERSEDED', updated_at = NOW()
    FROM notification_failed_jobs AS failed
    WHERE failed.notification_id IS NOT NULL
      AND retried.original_job_id = failed.latest_queue_job_id
      AND retried.id <> failed.notification_id
  `);
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    UPDATE notifications
    SET status = 'SENT', updated_at = NOW()
    WHERE status = 'SUPERSEDED'
  `);
  await queryInterface.removeConstraint(
    "notifications",
    "chk_notifications_status"
  );
  await queryInterface.addConstraint("notifications", {
    fields: ["status"],
    type: "check",
    where: queryInterface.sequelize.literal(existingStatuses),
    name: "chk_notifications_status",
  });
}
