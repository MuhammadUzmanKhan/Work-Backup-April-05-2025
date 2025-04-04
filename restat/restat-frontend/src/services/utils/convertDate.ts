
import moment from "moment"

export const convertDateFormat = (date: string | Date) => {
  return moment(date).format("llll")
}

export const convertDateOnlyFormat = (date: string | Date) => {
  return moment(date).format("ll")
}

