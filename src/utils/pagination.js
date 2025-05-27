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