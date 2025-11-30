"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = paginate;
function paginate(query) {
    const page = Math.max(parseInt(query.page || '1', 10), 1);
    const limit = Math.max(parseInt(query.limit || '10', 10), 1);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
