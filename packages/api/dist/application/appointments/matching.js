// Búsqueda de talleres para los servicios elegidos (docs/34 D4): primero los que cubren todas
// las categorías pedidas, luego por cantidad cubierta, calificación y nombre.
export function rankShops(shops, neededCategories) {
    const needed = [...new Set(neededCategories)];
    return shops
        .map((shop) => ({ ...shop, covered: needed.filter((c) => shop.services.includes(c)).length, needed: needed.length }))
        .filter((shop) => needed.length === 0 || shop.covered > 0)
        .sort((a, b) => b.covered - a.covered || b.ratingAvg - a.ratingAvg || a.name.localeCompare(b.name, "es"));
}
//# sourceMappingURL=matching.js.map