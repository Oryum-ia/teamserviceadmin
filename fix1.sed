# Función obtenerEstadisticasGlobales - cambiar la lógica de categorización de estados
/Mapear estado_actual a OrdenStatus/,/if (estadoKey && ordenesPorEstado\[estadoKey\] !== undefined) {/ {
  s/let estadoKey: OrdenStatus | null = null;/let estadoKey: OrdenStatus;/;
  s/if (estadoNormalizado\.includes\('pendiente'\)) {/if (estadoNormalizado.includes('finalizada') || estadoNormalizado.includes('completada') || estadoNormalizado.includes('entregada')) {\n      estadoKey = 'completada';\n    } else if (estadoNormalizado.includes('cancelada') || estadoNormalizado.includes('anulada')) {\n      estadoKey = 'cancelada';\n    } else if (estadoNormalizado.includes('repuesto') || estadoNormalizado.includes('esperando') || estadoNormalizado.includes('espera')) {\n      estadoKey = 'espera_repuestos';\n    } else if (estadoNormalizado.includes('pendiente')) {/;
  /else if.*estadoNormalizado\.includes\('proceso'/,/estadoKey = 'cancelada';/ {
    s/estadoKey = 'cancelada';/estadoKey = 'en_proceso';/;
  }
}
