export interface CatalogIssue {
    message: string;
}
/**
 * Valida la consistencia entre los tres catálogos:
 *  - cada servicio periódico cubre EXACTAMENTE sus combinaciones aplicables (sin huecos);
 *  - ninguna regla apunta a un servicio no periódico o a una combinación inaplicable;
 *  - no hay duplicados ni clases/combustibles desconocidos;
 *  - cada regla tiene al menos una dimensión de disparo (km o meses).
 * Devuelve la lista de problemas (vacía = catálogos consistentes).
 */
export declare function validateMaintenanceCatalogs(): CatalogIssue[];
//# sourceMappingURL=validation.d.ts.map