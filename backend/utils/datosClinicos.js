function leerCampos(valor, grupo = '') {
    const datos = typeof valor === 'string' ? JSON.parse(valor) : valor;
    if (!datos || typeof datos !== 'object') return [];
    return Object.entries(datos).flatMap(([clave, contenido]) => {
        const etiqueta = clave.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());
        const nombre = grupo ? grupo + ' · ' + etiqueta : etiqueta;
        if (contenido && typeof contenido === 'object') return leerCampos(contenido, nombre);
        if (typeof contenido === 'boolean') return [{ nombre, valor: contenido ? 'Sí' : 'No' }];
        if (typeof contenido === 'string' && contenido.trim()) return [{ nombre, valor: contenido.trim() }];
        if (typeof contenido === 'number') return [{ nombre, valor: String(contenido) }];
        return [];
    });
}

const camposAntecedentes = {
    ANTECEDENTES_FAMILIARES: 'Familiares',
    ANTECEDENTES_PERSONALES: 'Personales',
    ANTECEDENTES_PERSONALES_PATOLOGICOS: 'Patológicos',
    ANTECEDENTES_PERSONALES_NO_PATOLOGICOS: 'No patológicos',
    ANTECEDENTES_ALERGICOS: 'Alérgicos',
    ANTECEDENTES_QUIRURGICOS: 'Quirúrgicos',
    ANTECEDENTES_TRANSFUSIONALES: 'Transfusionales',
    ANTECEDENTES_TOXICOS: 'Tóxicos',
    ANTECEDENTES_GINECO_OBSTETRICOS: 'Gineco-obstétricos'
};

function presentarAntecedentes(antecedentes) {
    if (!antecedentes) return [];
    const campos = Object.entries(camposAntecedentes)
        .filter(([columna]) => antecedentes[columna]?.trim())
        .map(([columna, nombre]) => ({ nombre, valor: antecedentes[columna] }));
    return [...campos, ...leerCampos(antecedentes.DATOS_FORMULARIO)];
}

module.exports = { presentarAntecedentes, leerCampos };
