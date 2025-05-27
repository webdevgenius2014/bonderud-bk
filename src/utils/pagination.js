export class Pagination {
  static getOptions(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const sort = query.sort || 'createdAt';
    const order = query.order === 'asc' ? 'asc' : 'desc';

    return { page, limit, sort, order };
  }

  static getSkip(page, limit) {
    return (page - 1) * limit;
  }

  static createResult(
    data,
    total,
    page,
    limit
  ) {
    const pages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        total,
        pages,
        page,
        limit,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    };
  }

  static getSortOptions(sort, order) {
    return { [sort]: order === 'asc' ? 1 : -1 };
  }
}

// Helper function for pagination data
export const pagination = (page = 1, limit = 10, totalCount = 0) => {
  const currentPage = Math.max(1, parseInt(page));
  const itemsPerPage = Math.min(100, Math.max(1, parseInt(limit)));
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const skip = (currentPage - 1) * itemsPerPage;

  return {
    page: currentPage,
    limit: itemsPerPage,
    totalPages,
    totalCount,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    skip
  };
};