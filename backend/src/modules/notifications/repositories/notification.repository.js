import { Op } from "sequelize";
import Notification from "../models/Notification.js";

const findById = async (id) => Notification.findByPk(id);

const findOrCreateByJobId = async (originalJobId, defaults) =>
  Notification.findOrCreate({
    where: { originalJobId },
    defaults,
  });

const updateById = async (id, values, where = {}) => {
  const [updated] = await Notification.update(values, {
    where: { id, ...where },
  });

  return updated === 1;
};

const list = async ({ limit, offset, status }) =>
  Notification.findAndCountAll({
    where: status
      ? { status }
      : { status: { [Op.ne]: "SUPERSEDED" } },
    limit,
    offset,
    order: [["queuedAt", "DESC"], ["id", "DESC"]],
  });

export default {
  findById,
  findOrCreateByJobId,
  updateById,
  list,
};
