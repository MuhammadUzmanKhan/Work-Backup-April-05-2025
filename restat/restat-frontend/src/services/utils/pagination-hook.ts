import { useState } from "react"

export const usePagination = (_pageSize = "10") => {
    const pageSize = Number(_pageSize);
    const [pageNum, setPageNum] = useState(0);
    const [end, setEnd] = useState(false);
    const [totalPages, setTotalPages] = useState(0);

    const limit = pageSize;
    const offset = pageSize * pageNum;

    const nextPage = () => {
        setPageNum(pageNum + 1);
    }

    const endReached = () => setEnd(true);

    const calculateTotalPages = (totalRecords = 0) => {
        setTotalPages(Math.ceil(totalRecords / pageSize))
    }

    return {
        limit,
        offset,
        pageSize,
        pageNum,
        totalPages,
        end,
        setPageNum,
        nextPage,
        endReached,
        calculateTotalPages,
    }
}