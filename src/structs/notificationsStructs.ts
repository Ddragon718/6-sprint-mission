import { boolean, coerce, defaulted, integer, object, optional, string } from "superstruct";

const integerString = coerce(integer(), string(), (value) => parseInt(value));

export const GetNotificationListParamsStruct = object({
  page: defaulted(integerString, 1),
  pageSize: defaulted(integerString, 10),
  isRead: optional(coerce(boolean(), string(), (value) => value === "true")),
});
