import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PieChart, BarChart3, List, TrendingUp, Loader2, BrainCircuit } from 'lucide-react';
import { Card, calculatePeriodInfo, getCategoryIcon, cn } from '../components/Components';
import { MonthlyReport } from '../types';
import { getMonthlyReports } from '../services/db';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

type SortField = 'categoryName' | 'presupuesto' | 'gastoReal' | 'variation';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'single' | 'history' | 'analysis';

// Presupuestos Maestros para ordenamiento y consistencia
const MASTER_BUDGETS: Record<string, number> = {
  "ALQUILER": 2800,
  "COMIDA FUERA": 700,
  "SUPERMERCADO": 650,
  "OCIO": 400,
  "TRANSPORTE": 225,
  "ROPA": 170,
  "SERVICIOS": 163,
  "AMAZON": 150,
  "SEGURO DE SALUD": 123,
  "EXTRA": 100,
  "IKER": 89,
  "GYM": 70,
  "PLATAFORMAS": 35,
  "PELUQUERIA": 25
};

const TOTAL_BUDGET = 5700;

// Helper para totales: MANUAL y FORZADO para asegurar formato "7.000"
const formatTotal = (val: number) => {
  if (isNaN(val)) return "0";
  // Redondeamos y usamos Regex para poner puntos de miles manualmente
  return Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Helper seguro para obtener presupuesto maestro
const getMasterBudget = (catName: string) => {
    const key = catName ? catName.trim().toUpperCase() : "";
    return MASTER_BUDGETS[key] || 0;
};

const recalculateLegacy = (data: MonthlyReport[]): MonthlyReport[] => {
    return data.map(r => {
        const newDetails = r.detalles.map(d => {
            const newBudget = getMasterBudget(d.categoryName) || d.presupuesto;
            return { ...d, presupuesto: newBudget, diferencia: newBudget - d.gastoReal };
        });
        return {
            ...r,
            totalGlobalPresupuesto: TOTAL_BUDGET,
            totalGlobalDiferencia: TOTAL_BUDGET - r.totalGlobalGasto,
            detalles: newDetails
        };
    });
};

// --- DATOS HISTÓRICOS ---
const RAW_LEGACY_HISTORY: MonthlyReport[] = [
    {
        id: 'legacy-p30', numeroPeriodo: 30, totalGlobalPresupuesto: 0, totalGlobalGasto: 5197, totalGlobalDiferencia: 0, estado: 'cerrado', fechaInicio: '2025-10-12T00:00:00Z', fechaFin: '2025-11-11T00:00:00Z', fechaCierre: '2025-11-11T00:00:00Z',
        detalles: [ { categoryId: 'l30-alq', categoryName: 'ALQUILER', presupuesto: 0, gastoReal: 2860, diferencia: 0 }, { categoryId: 'l30-amz', categoryName: 'AMAZON', presupuesto: 0, gastoReal: 68, diferencia: 0 }, { categoryId: 'l30-ext', categoryName: 'EXTRA', presupuesto: 0, gastoReal: 472, diferencia: 0 }, { categoryId: 'l30-gym', categoryName: 'GYM', presupuesto: 0, gastoReal: 140, diferencia: 0 }, { categoryId: 'l30-ike', categoryName: 'IKER', presupuesto: 0, gastoReal: 104, diferencia: 0 }, { categoryId: 'l30-sup', categoryName: 'SUPERMERCADO', presupuesto: 0, gastoReal: 476, diferencia: 0 }, { categoryId: 'l30-ser', categoryName: 'SERVICIOS', presupuesto: 0, gastoReal: 114, diferencia: 0 }, { categoryId: 'l30-seg', categoryName: 'SEGURO DE SALUD', presupuesto: 0, gastoReal: 121, diferencia: 0 }, { categoryId: 'l30-pla', categoryName: 'PLATAFORMAS', presupuesto: 0, gastoReal: 35, diferencia: 0 }, { categoryId: 'l30-oci', categoryName: 'OCIO', presupuesto: 0, gastoReal: 32, diferencia: 0 }, { categoryId: 'l30-com', categoryName: 'COMIDA FUERA', presupuesto: 0, gastoReal: 552, diferencia: 0 }, { categoryId: 'l30-tra', categoryName: 'TRANSPORTE', presupuesto: 0, gastoReal: 71, diferencia: 0 }, { categoryId: 'l30-rop', categoryName: 'ROPA', presupuesto: 0, gastoReal: 151, diferencia: 0 } ]
    },
    { id: 'legacy-p29', numeroPeriodo: 29, totalGlobalPresupuesto: 0, totalGlobalGasto: 4968, totalGlobalDiferencia: 0, estado: 'cerrado', fechaInicio: '2025-09-12T00:00:00Z', fechaFin: '2025-10-11T00:00:00Z', fechaCierre: '2025-10-11T00:00:00Z', detalles: [ { categoryId: 'l29-alq', categoryName: 'ALQUILER', presupuesto: 0, gastoReal: 2860, diferencia: 0 }, { categoryId: 'l29-amz', categoryName: 'AMAZON', presupuesto: 0, gastoReal: 22, diferencia: 0 }, { categoryId: 'l29-ext', categoryName: 'EXTRA', presupuesto: 0, gastoReal: 666, diferencia: 0 }, { categoryId: 'l29-gym', categoryName: 'GYM', presupuesto: 0, gastoReal: 56, diferencia: 0 }, { categoryId: 'l29-ike', categoryName: 'IKER', presupuesto: 0, gastoReal: 44, diferencia: 0 }, { categoryId: 'l29-pel', categoryName: 'PELUQUERIA', presupuesto: 0, gastoReal: 20, diferencia: 0 }, { categoryId: 'l29-rop', categoryName: 'ROPA', presupuesto: 0, gastoReal: 62, diferencia: 0 }, { categoryId: 'l29-sup', categoryName: 'SUPERMERCADO', presupuesto: 0, gastoReal: 566, diferencia: 0 }, { categoryId: 'l29-ser', categoryName: 'SERVICIOS', presupuesto: 0, gastoReal: 83, diferencia: 0 }, { categoryId: 'l29-seg', categoryName: 'SEGURO DE SALUD', presupuesto: 0, gastoReal: 121, diferencia: 0 }, { categoryId: 'l29-pla', categoryName: 'PLATAFORMAS', presupuesto: 0, gastoReal: 35, diferencia: 0 }, { categoryId: 'l29-com', categoryName: 'COMIDA FUERA', presupuesto: 0, gastoReal: 296, diferencia: 0 }, { categoryId: 'l29-tra', categoryName: 'TRANSPORTE', presupuesto: 0, gastoReal: 137, diferencia: 0 } ] },
    { id: 'legacy-p28', numeroPeriodo: 28, totalGlobalPresupuesto: 0, totalGlobalGasto: 4830, totalGlobalDiferencia: 0, estado: 'cerrado', fechaInicio: '2025-08-12T00:00:00Z', fechaFin: '2025-09-11T00:00:00Z', fechaCierre: '2025-09-11T00:00:00Z', detalles: [ { categoryId: 'l28-alq', categoryName: 'ALQUILER', presupuesto: 0, gastoReal: 2860, diferencia: 0 }, { categoryId: 'l28-amz', categoryName: 'AMAZON', presupuesto: 0, gastoReal: 203, diferencia: 0 }, { categoryId: 'l28-ext', categoryName: 'EXTRA', presupuesto: 0, gastoReal: 365, diferencia: 0 }, { categoryId: 'l28-gym', categoryName: 'GYM', presupuesto: 0, gastoReal: 56, diferencia: 0 }, { categoryId: 'l28-ike', categoryName: 'IKER', presupuesto: 0, gastoReal: 106, diferencia: 0 }, { categoryId: 'l28-pel', categoryName: 'PELUQUERIA', presupuesto: 0, gastoReal: 30, diferencia: 0 }, { categoryId: 'l28-rop', categoryName: 'ROPA', presupuesto: 0, gastoReal: 100, diferencia: 0 }, { categoryId: 'l28-sup', categoryName: 'SUPERMERCADO', presupuesto: 0, gastoReal: 418, diferencia: 0 }, { categoryId: 'l28-ser', categoryName: 'SERVICIOS', presupuesto: 0, gastoReal: 127, diferencia: 0 }, { categoryId: 'l28-seg', categoryName: 'SEGURO DE SALUD', presupuesto: 0, gastoReal: 121, diferencia: 0 }, { categoryId: 'l28-pla', categoryName: 'PLATAFORMAS', presupuesto: 0, gastoReal: 35, diferencia: 0 }, { categoryId: 'l28-com', categoryName: 'COMIDA FUERA', presupuesto: 0, gastoReal: 402, diferencia: 0 }, { categoryId: 'l28-tra', categoryName: 'TRANSPORTE', presupuesto: 0, gastoReal: 7, diferencia: 0 } ] },
    { id: 'legacy-p27', numeroPeriodo: 27, totalGlobalPresupuesto: 0, totalGlobalGasto: 5123, totalGlobalDiferencia: 0, estado: 'cerrado', fechaInicio: '2025-07-12T00:00:00Z', fechaFin: '2025-08-11T00:00:00Z', fechaCierre: '2025-08-11T00:00:00Z', detalles: [ { categoryName: 'ALQUILER', gastoReal: 2840, presupuesto: 0 }, { categoryName: 'AMAZON', gastoReal: 34, presupuesto: 0 }, { categoryName: 'EXTRA', gastoReal: 723, presupuesto: 0 }, { categoryName: 'GYM', gastoReal: 56, presupuesto: 0 }, { categoryName: 'IKER', gastoReal: 20, presupuesto: 0 }, { categoryName: 'PELUQUERIA', gastoReal: 170, presupuesto: 0 }, { categoryName: 'ROPA', gastoReal: 314, presupuesto: 0 }, { categoryName: 'SUPERMERCADO', gastoReal: 408, presupuesto: 0 }, { categoryName: 'SERVICIOS', gastoReal: 125, presupuesto: 0 }, { categoryName: 'SEGURO DE SALUD', gastoReal: 121, presupuesto: 0 }, { categoryName: 'PLATAFORMAS', gastoReal: 35, presupuesto: 0 }, { categoryName: 'OCIO', gastoReal: 25, presupuesto: 0 }, { categoryName: 'COMIDA FUERA', gastoReal: 252, presupuesto: 0 } ] },
    { id: 'legacy-p26', numeroPeriodo: 26, totalGlobalPresupuesto: 0, totalGlobalGasto: 5169, totalGlobalDiferencia: 0, estado: 'cerrado', fechaInicio: '2025-06-12T00:00:00Z', fechaFin: '2025-07-11T00:00:00Z', fechaCierre: '2025-07-11T00:00:00Z', detalles: [ { categoryName: 'ALQUILER', gastoReal: 2800, presupuesto: 0 }, { categoryName: 'AMAZON', gastoReal: 111, presupuesto: 0 }, { categoryName: 'EXTRA', gastoReal: 326, presupuesto: 0 }, { categoryName: 'GYM', gastoReal: 97, presupuesto: 0 }, { categoryName: 'IKER', gastoReal: 93, presupuesto: 0 }, { categoryName: 'PELUQUERIA', gastoReal: 20, presupuesto: 0 }, { categoryName: 'ROPA', gastoReal: 586, presupuesto: 0 }, { categoryName: 'SUPERMERCADO', gastoReal: 500, presupuesto: 0 }, { categoryName: 'SERVICIOS', gastoReal: 89, presupuesto: 0 }, { categoryName: 'SEGURO DE SALUD', gastoReal: 121, presupuesto: 0 }, { categoryName: 'PLATAFORMAS', gastoReal: 35, presupuesto: 0 }, { categoryName: 'OCIO', gastoReal: 60, presupuesto: 0 }, { categoryName: 'COMIDA FUERA', gastoReal: 262, presupuesto: 0 }, { categoryName: 'TRANSPORTE', gastoReal: 69, presupuesto: 0 } ] },
    { id: 'legacy-p25', numeroPeriodo: 25, totalGlobalPresupuesto: 0, totalGlobalGasto: 4965, totalGlobalDiferencia: 0, estado: 'cerrado', fechaInicio: '2025-05-12T00:00:00Z', fechaFin: '2025-06-11T00:00:00Z', fechaCierre: '2025-06-11T00:00:00Z', detalles: [ { categoryName: 'ALQUILER', gastoReal: 2800, presupuesto: 0 }, { categoryName: 'AMAZON', gastoReal: 34, presupuesto: 0 }, { categoryName: 'EXTRA', gastoReal: 664, presupuesto: 0 }, { categoryName: 'GYM', gastoReal: 159, presupuesto: 0 }, { categoryName: 'IKER', gastoReal: 46, presupuesto: 0 }, { categoryName: 'SUPERMERCADO', gastoReal: 658, presupuesto: 0 }, { categoryName: 'SERVICIOS', gastoReal: 76, presupuesto: 0 }, { categoryName: 'SEGURO DE SALUD', gastoReal: 121, presupuesto: 0 }, { categoryName: 'PLATAFORMAS', gastoReal: 35, presupuesto: 0 }, { categoryName: 'OCIO', gastoReal: 102, presupuesto: 0 }, { categoryName: 'COMIDA FUERA', gastoReal: 264, presupuesto: 0 }, { categoryName: 'TRANSPORTE', gastoReal: 6, presupuesto: 0 } ] },
    { id: 'legacy-p24', numeroPeriodo: 24, totalGlobalPresupuesto: 0, totalGlobalGasto: 3682, totalGlobalDiferencia: 0, estado: 'cerrado', fechaInicio: '2025-04-12T00:00:00Z', fechaFin: '2025-05-11T00:00:00Z', fechaCierre: '2025-05-11T00:00:00Z', detalles: [ { categoryName: 'ALQUILER', gastoReal: 2800, presupuesto: 0 }, { categoryName: 'AMAZON', gastoReal: 24, presupuesto: 0 }, { categoryName: 'EXTRA', gastoReal: 26, presupuesto: 0 }, { categoryName: 'IKER', gastoReal: 114, presupuesto: 0 }, { categoryName: 'SUPERMERCADO', gastoReal: 315, presupuesto: 0 }, { categoryName: 'SERVICIOS', gastoReal: 121, presupuesto: 0 }, { categoryName: 'SEGURO DE SALUD', gastoReal: 121, presupuesto: 0 }, { categoryName: 'PLATAFORMAS', gastoReal: 35, presupuesto: 0 }, { categoryName: 'OCIO', gastoReal: 0, presupuesto: 0 }, { categoryName: 'COMIDA FUERA', gastoReal: 114, presupuesto: 0 }, { categoryName: 'TRANSPORTE', gastoReal: 12, presupuesto: 0 } ] },
    { id: 'legacy-p23', numeroPeriodo: 23, totalGlobalPresupuesto: 0, totalGlobalGasto: 4664, totalGlobalDiferencia: 0, estado: 'cerrado', fechaInicio: '2025-03-12T00:00:00Z', fechaFin: '2025-04-11T00:00:00Z', fechaCierre: '2025-04-11T00:00:00Z', detalles: [ { categoryName: 'ALQUILER', gastoReal: 2800, presupuesto: 0 }, { categoryName: 'AMAZON', gastoReal: 80, presupuesto: 0 }, { categoryName: 'EXTRA', gastoReal: 83, presupuesto: 0 }, { categoryName: 'IKER', gastoReal: 68, presupuesto: 0 }, { categoryName: 'PELUQUERIA', gastoReal: 29, presupuesto: 0 }, { categoryName: 'ROPA', gastoReal: 509, presupuesto: 0 }, { categoryName: 'SUPERMERCADO', gastoReal: 321, presupuesto: 0 }, { categoryName: 'SERVICIOS', gastoReal: 133, presupuesto: 0 }, { categoryName: 'SEGURO DE SALUD', gastoReal: 123, presupuesto: 0 }, { categoryName: 'PLATAFORMAS', gastoReal: 35, presupuesto: 0 }, { categoryName: 'OCIO', gastoReal: 368, presupuesto: 0 }, { categoryName: 'COMIDA FUERA', gastoReal: 74, presupuesto: 0 }, { categoryName: 'TRANSPORTE', gastoReal: 40, presupuesto: 0 } ] },
    { id: 'legacy-p22', numeroPeriodo: 22, totalGlobalPresupuesto: 0, totalGlobalGasto: 4507, totalGlobalDiferencia: 0, estado: 'cerrado', fechaInicio: '2025-02-12T00:00:00Z', fechaFin: '2025-03-11T00:00:00Z', fechaCierre: '2025-03-11T00:00:00Z', detalles: [ { categoryName: 'ALQUILER', gastoReal: 2800, presupuesto: 0 }, { categoryName: 'AMAZON', gastoReal: 153, presupuesto: 0 }, { categoryName: 'EXTRA', gastoReal: 254, presupuesto: 0 }, { categoryName: 'IKER', gastoReal: 18, presupuesto: 0 }, { categoryName: 'PELUQUERIA', gastoReal: 177, presupuesto: 0 }, { categoryName: 'ROPA', gastoReal: 258, presupuesto: 0 }, { categoryName: 'SUPERMERCADO', gastoReal: 534, presupuesto: 0 }, { categoryName: 'SERVICIOS', gastoReal: 99, presupuesto: 0 }, { categoryName: 'SEGURO DE SALUD', gastoReal: 123, presupuesto: 0 }, { categoryName: 'PLATAFORMAS', gastoReal: 35, presupuesto: 0 }, { categoryName: 'COMIDA FUERA', gastoReal: 44, presupuesto: 0 }, { categoryName: 'TRANSPORTE', gastoReal: 12, presupuesto: 0 } ] },
    { id: 'legacy-p21', numeroPeriodo: 21, totalGlobalPresupuesto: 0, totalGlobalGasto: 3943, totalGlobalDiferencia: 0, estado: 'cerrado', fechaInicio: '2025-01-12T00:00:00Z', fechaFin: '2025-02-11T00:00:00Z', fechaCierre: '2025-02-11T00:00:00Z', detalles: [ { categoryName: 'ALQUILER', gastoReal: 2800, presupuesto: 0 }, { categoryName: 'AMAZON', gastoReal: 71, presupuesto: 0 }, { categoryName: 'EXTRA', gastoReal: 177, presupuesto: 0 }, { categoryName: 'IKER', gastoReal: 25, presupuesto: 0 }, { categoryName: 'PELUQUERIA', gastoReal: 23, presupuesto: 0 }, { categoryName: 'ROPA', gastoReal: 183, presupuesto: 0 }, { categoryName: 'SUPERMERCADO', gastoReal: 338, presupuesto: 0 }, { categoryName: 'SERVICIOS', gastoReal: 109, presupuesto: 0 }, { categoryName: 'SEGURO DE SALUD', gastoReal: 123, presupuesto: 0 }, { categoryName: 'PLATAFORMAS', gastoReal: 35, presupuesto: 0 }, { categoryName: 'COMIDA FUERA', gastoReal: 76, presupuesto: 0 }, { categoryName: 'TRANSPORTE', gastoReal: 6, presupuesto: 0 } ] },
    { id: 'legacy-p20', numeroPeriodo: 20, totalGlobalPresupuesto: 0, totalGlobalGasto: 5460, totalGlobalDiferencia: 0, estado: 'cerrado', fechaInicio: '2024-12-12T00:00:00Z', fechaFin: '2025-01-11T00:00:00Z', fechaCierre: '2025-01-11T00:00:00Z', detalles: [ { categoryName: 'ALQUILER', gastoReal: 2800, presupuesto: 0 }, { categoryName: 'AMAZON', gastoReal: 299, presupuesto: 0 }, { categoryName: 'EXTRA', gastoReal: 463, presupuesto: 0 }, { categoryName: 'GYM', gastoReal: 159, presupuesto: 0 }, { categoryName: 'IKER', gastoReal: 35, presupuesto: 0 }, { categoryName: 'ROPA', gastoReal: 294, presupuesto: 0 }, { categoryName: 'SUPERMERCADO', gastoReal: 882, presupuesto: 0 }, { categoryName: 'SERVICIOS', gastoReal: 79, presupuesto: 0 }, { categoryName: 'SEGURO DE SALUD', gastoReal: 123, presupuesto: 0 }, { categoryName: 'PLATAFORMAS', gastoReal: 35, presupuesto: 0 }, { categoryName: 'COMIDA FUERA', gastoReal: 263, presupuesto: 0 }, { categoryName: 'TRANSPORTE', gastoReal: 6, presupuesto: 0 } ] },
    { id: 'legacy-p19', numeroPeriodo: 19, totalGlobalPresupuesto: 0, totalGlobalGasto: 5120, totalGlobalDiferencia: 0, estado: 'cerrado', fechaInicio: '2024-11-12T00:00:00Z', fechaFin: '2024-12-11T00:00:00Z', fechaCierre: '2024-12-11T00:00:00Z', detalles: [ { categoryName: 'ALQUILER', gastoReal: 2800, presupuesto: 0 }, { categoryName: 'AMAZON', gastoReal: 390, presupuesto: 0 }, { categoryName: 'EXTRA', gastoReal: 376, presupuesto: 0 }, { categoryName: 'IKER', gastoReal: 134, presupuesto: 0 }, { categoryName: 'ROPA', gastoReal: 222, presupuesto: 0 }, { categoryName: 'SUPERMERCADO', gastoReal: 649, presupuesto: 0 }, { categoryName: 'SERVICIOS', gastoReal: 89, presupuesto: 0 }, { categoryName: 'SEGURO DE SALUD', gastoReal: 123, presupuesto: 0 }, { categoryName: 'PLATAFORMAS', gastoReal: 35, presupuesto: 0 }, { categoryName: 'OCIO', gastoReal: 9, presupuesto: 0 }, { categoryName: 'COMIDA FUERA', gastoReal: 280, presupuesto: 0 }, { categoryName: 'TRANSPORTE', gastoReal: 12, presupuesto: 0 } ] },
    { id: 'legacy-p18', numeroPeriodo: 18, totalGlobalPresupuesto: 0, totalGlobalGasto: 5173, totalGlobalDiferencia: 0, estado: 'cerrado', fechaInicio: '2024-10-12T00:00:00Z', fechaFin: '2024-11-11T00:00:00Z', fechaCierre: '2024-11-11T00:00:00Z', detalles: [ { categoryName: 'ALQUILER', gastoReal: 2800, presupuesto: 0 }, { categoryName: 'AMAZON', gastoReal: 54, presupuesto: 0 }, { categoryName: 'EXTRA', gastoReal: 260, presupuesto: 0 }, { categoryName: 'IKER', gastoReal: 18, presupuesto: 0 }, { categoryName: 'ROPA', gastoReal: 60, presupuesto: 0 }, { categoryName: 'SUPERMERCADO', gastoReal: 958, presupuesto: 0 }, { categoryName: 'SERVICIOS', gastoReal: 107, presupuesto: 0 }, { categoryName: 'SEGURO DE SALUD', gastoReal: 123, presupuesto: 0 }, { categoryName: 'PLATAFORMAS', gastoReal: 35, presupuesto: 0 }, { categoryName: 'OCIO', gastoReal: 95, presupuesto: 0 }, { categoryName: 'COMIDA FUERA', gastoReal: 478, presupuesto: 0 }, { categoryName: 'TRANSPORTE', gastoReal: 187, presupuesto: 0 } ] },
    { id: 'legacy-p17', numeroPeriodo: 17, totalGlobalPresupuesto: 0, totalGlobalGasto: 4302, totalGlobalDiferencia: 0, estado: 'cerrado', fechaInicio: '2024-09-12T00:00:00Z', fechaFin: '2024-10-11T00:00:00Z', fechaCierre: '2024-10-11T00:00:00Z', detalles: [ { categoryName: 'ALQUILER', gastoReal: 2800, presupuesto: 0 }, { categoryName: 'AMAZON', gastoReal: 28, presupuesto: 0 }, { categoryName: 'EXTRA', gastoReal: 356, presupuesto: 0 }, { categoryName: 'IKER', gastoReal: 391, presupuesto: 0 }, { categoryName: 'PELUQUERIA', gastoReal: 14, presupuesto: 0 }, { categoryName: 'ROPA', gastoReal: 110, presupuesto: 0 }, { categoryName: 'SUPERMERCADO', gastoReal: 207, presupuesto: 0 }, { categoryName: 'SERVICIOS', gastoReal: 43, presupuesto: 0 }, { categoryName: 'SEGURO DE SALUD', gastoReal: 123, presupuesto: 0 }, { categoryName: 'PLATAFORMAS', gastoReal: 35, presupuesto: 0 }, { categoryName: 'OCIO', gastoReal: 27, presupuesto: 0 }, { categoryName: 'COMIDA FUERA', gastoReal: 112, presupuesto: 0 }, { categoryName: 'TRANSPORTE', gastoReal: 57, presupuesto: 0 } ] },
    { id: 'legacy-p16', numeroPeriodo: 16, totalGlobalPresupuesto: 0, totalGlobalGasto: 4922, totalGlobalDiferencia: 0, estado: 'cerrado', fechaInicio: '2024-08-12T00:00:00Z', fechaFin: '2024-09-11T00:00:00Z', fechaCierre: '2024-09-11T00:00:00Z', detalles: [ { categoryName: 'ALQUILER', gastoReal: 2800, presupuesto: 0 }, { categoryName: 'AMAZON', gastoReal: 102, presupuesto: 0 }, { categoryName: 'EXTRA', gastoReal: 353, presupuesto: 0 }, { categoryName: 'IKER', gastoReal: 97, presupuesto: 0 }, { categoryName: 'ROPA', gastoReal: 255, presupuesto: 0 }, { categoryName: 'SUPERMERCADO', gastoReal: 740, presupuesto: 0 }, { categoryName: 'SERVICIOS', gastoReal: 46, presupuesto: 0 }, { categoryName: 'SEGURO DE SALUD', gastoReal: 123, presupuesto: 0 }, { categoryName: 'PLATAFORMAS', gastoReal: 35, presupuesto: 0 }, { categoryName: 'OCIO', gastoReal: 29, presupuesto: 0 }, { categoryName: 'COMIDA FUERA', gastoReal: 318, presupuesto: 0 }, { categoryName: 'TRANSPORTE', gastoReal: 23, presupuesto: 0 } ] }
];

const LEGACY_HISTORY = recalculateLegacy(RAW_LEGACY_HISTORY);

export const Reports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [loading, setLoading] = useState(true);
  
  const [sortField, setSortField] = useState<SortField>('categoryName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
        setLoading(true);
        const dbData = await getMonthlyReports();
        const combinedData = [...dbData, ...LEGACY_HISTORY];
        const sorted = combinedData.sort((a, b) => {
            const dateA = a.fechaFin ? new Date(a.fechaFin).getTime() : 0;
            const dateB = b.fechaFin ? new Date(b.fechaFin).getTime() : 0;
            return dateB - dateA;
        });
        setReports(sorted);
        if (sorted.length > 0 && !selectedReportId) {
            setSelectedReportId(sorted[0].id);
        }
    } catch (error) {
        setReports(LEGACY_HISTORY);
        setSelectedReportId(LEGACY_HISTORY[0].id);
    } finally {
        setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
        setSortField(field);
        setSortOrder('asc');
    }
  };

  const currentReport = reports.find(r => r.id === selectedReportId) || reports[0];

  const getPeriodLabel = (report: MonthlyReport, short = false) => {
      try {
          if (report.fechaInicio && report.fechaFin) {
              const start = new Date(report.fechaInicio);
              const end = new Date(report.fechaFin);
              const pNum = report.numeroPeriodo ? `P${report.numeroPeriodo}` : 'P?';
              if (short) return `${pNum}`;
              return `${pNum} (${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM', { locale: es })})`.toUpperCase();
          }
          if (report.id.startsWith('legacy')) return `P${report.numeroPeriodo}`;
          return "P?";
      } catch (e) { return "Error"; }
  };

  const historyPeriods = [...reports].sort((a, b) => {
      const pNumA = a.numeroPeriodo || 0;
      const pNumB = b.numeroPeriodo || 0;
      if (pNumA !== pNumB) return pNumA - pNumB;
      return 0;
  });
  
  const allCategories = Array.from(new Set(reports.flatMap(r => r.detalles.map(d => d.categoryName))))
    .sort((a, b) => {
        const budgetA = getMasterBudget(a);
        const budgetB = getMasterBudget(b);
        if (budgetB !== budgetA) return budgetB - budgetA;
        return a.localeCompare(b);
    });

  const sortedDetails = currentReport ? [...currentReport.detalles].sort((a, b) => {
      let valA: any = a[sortField as keyof typeof a];
      let valB: any = b[sortField as keyof typeof b];
      if (sortField === 'categoryName') {
          valA = getMasterBudget(a.categoryName);
          valB = getMasterBudget(b.categoryName);
          // Si los presupuestos maestros son distintos, ordena por eso SIEMPRE
          if (valA !== valB) {
              // Ascending sort actually means higher budget first in our context (Fixed Rank)
              return sortOrder === 'asc' ? valB - valA : valA - valB;
          }
          // Si son iguales (o 0), usa alfabético
          return a.categoryName.localeCompare(b.categoryName);
      }
      if (sortField === 'variation') {
          valA = a.presupuesto > 0 ? (a.gastoReal / a.presupuesto) : 0;
          valB = b.presupuesto > 0 ? (b.gastoReal / b.presupuesto) : 0;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
  }) : [];

  // --- LOGICA DE REBALANCEO SUMA CERO ---
  const analyzeBudgets = () => {
      const recentPeriods = historyPeriods.slice(-6); 
      if (recentPeriods.length === 0) return null;

      const candidates: {name: string, diff: number, avgSpend: number, currentBudget: number}[] = [];

      allCategories.forEach(cat => {
          let totalSpend = 0;
          let periodsWithSpend = 0;
          const currentBudget = getMasterBudget(cat);

          recentPeriods.forEach(p => {
              const d = p.detalles.find(det => det.categoryName === cat);
              if (d) { totalSpend += d.gastoReal; periodsWithSpend++; }
          });

          const avgSpend = periodsWithSpend > 0 ? totalSpend / periodsWithSpend : 0;
          const idealBudget = Math.round(avgSpend / 10) * 10; 
          const diff = idealBudget - currentBudget;

          if (Math.abs(diff) >= 10) { 
              candidates.push({ name: cat, diff, avgSpend, currentBudget });
          }
      });

      let increases = candidates.filter(c => c.diff > 0).sort((a,b) => b.diff - a.diff);
      let decreases = candidates.filter(c => c.diff < 0).sort((a,b) => a.diff - b.diff);

      const totalIncreaseNeeded = increases.reduce((acc, c) => acc + c.diff, 0);
      const totalDecreaseAvailable = Math.abs(decreases.reduce((acc, c) => acc + c.diff, 0));
      const rebalanceAmount = Math.min(totalIncreaseNeeded, totalDecreaseAvailable);

      if (rebalanceAmount === 0) return { overBudgetItems: [], underBudgetItems: [], recentPeriods };

      const finalIncreases: any[] = [];
      let accumulatedInc = 0;
      for (const item of increases) {
          if (accumulatedInc >= rebalanceAmount) break;
          const amount = Math.min(item.diff, rebalanceAmount - accumulatedInc);
          finalIncreases.push({ ...item, suggestedChange: amount });
          accumulatedInc += amount;
      }

      const finalDecreases: any[] = [];
      let accumulatedDec = 0;
      for (const item of decreases) {
          if (accumulatedDec >= rebalanceAmount) break;
          const absDiff = Math.abs(item.diff);
          const amount = Math.min(absDiff, rebalanceAmount - accumulatedDec);
          finalDecreases.push({ ...item, suggestedChange: -amount });
          accumulatedDec += amount;
      }

      return { overBudgetItems: finalIncreases, underBudgetItems: finalDecreases, recentPeriods };
  };

  const analysis = analyzeBudgets();

  const renderChart = () => {
      if (historyPeriods.length < 2) return null;
      const expenses = historyPeriods.map(p => p.totalGlobalGasto);
      const budgets = historyPeriods.map(p => p.totalGlobalPresupuesto);
      
      const allValues = [...expenses, ...budgets];
      const minVal = Math.min(...allValues) * 0.95; 
      const maxVal = Math.max(...allValues) * 1.05; 
      const range = maxVal - minVal;

      const avgExp = expenses.reduce((a, b) => a + b, 0) / expenses.length;
      const avgY = 100 - ((avgExp - minVal) / range) * 100;
      
      const points = historyPeriods.map((p, i) => {
          const x = (i / (historyPeriods.length - 1)) * 100;
          const y = 100 - ((p.totalGlobalGasto - minVal) / range) * 100;
          return { x, y, val: p.totalGlobalGasto, label: `P${p.numeroPeriodo}` };
      });
      const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;

      const budgetPoints = historyPeriods.map((p, i) => {
          const x = (i / (historyPeriods.length - 1)) * 100;
          const y = 100 - ((p.totalGlobalPresupuesto - minVal) / range) * 100;
          return { x, y };
      });
      
      let budgetPathD = "";
      budgetPoints.forEach((p, i) => {
          if (i === 0) {
              budgetPathD += `M ${p.x} ${p.y}`;
          } else {
              const prev = budgetPoints[i-1];
              budgetPathD += ` L ${p.x} ${prev.y} L ${p.x} ${p.y}`;
          }
      });

      return (
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tendencia</h3>
                  <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-0.5 bg-blue-500 rounded-full"></div>
                        <span className="text-[10px] font-medium text-gray-400">Gasto</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-0.5 bg-green-400 border-t border-dashed"></div>
                        <span className="text-[10px] font-medium text-gray-400">Ppto</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-0.5 bg-gray-400 border-t border-dotted"></div>
                        <span className="text-[10px] font-medium text-gray-400">Prom: {formatTotal(avgExp)}</span>
                      </div>
                  </div>
              </div>
              <div className="h-[150px] w-full relative pl-8">
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[9px] text-gray-400 font-medium py-1">
                      <span>{formatTotal(maxVal)}</span>
                      <span>{formatTotal(minVal + range/2)}</span>
                      <span>{formatTotal(minVal)}</span>
                  </div>
                  <svg viewBox={`0 0 100 100`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
                      <line x1="0" y1="0" x2="100" y2="0" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="100" x2="100" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                      
                      {/* Promedio (Gris Punteada) */}
                      <line x1="0" y1={avgY} x2="100" y2={avgY} stroke="#9ca3af" strokeWidth="1" strokeDasharray="2" />

                      {/* Presupuesto (Verde Discontinua Escalera) */}
                      <path d={budgetPathD} fill="none" stroke="#4ade80" strokeWidth="2" strokeDasharray="4" vectorEffect="non-scaling-stroke" />
                      
                      {/* Gasto (Azul Sólida) */}
                      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
                      
                      {points.map((p, i) => (
                          <g key={i}>
                              {(i % 2 === 0 || i === points.length - 1) && (
                                  <text x={p.x} y="115" textAnchor="middle" fontSize="3.5" fill="#94a3b8">{p.label}</text>
                              )}
                          </g>
                      ))}
                  </svg>
              </div>
          </div>
      );
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600"><ArrowLeft size={24} /></button>
            <h1 className="text-2xl font-bold text-slate-900">Informes</h1>
        </div>
      </div>

      {loading && <div className="flex justify-center py-20 text-blue-500"><Loader2 size={32} className="animate-spin" /></div>}

      {!loading && (
        <>
            {reports.length > 0 && (
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setViewMode('single')} className={cn("flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2", viewMode === 'single' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500")}><PieChart size={14} /> Mensual</button>
                    <button onClick={() => setViewMode('history')} className={cn("flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2", viewMode === 'history' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500")}><TrendingUp size={14} /> Evolución</button>
                    <button onClick={() => setViewMode('analysis')} className={cn("flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2", viewMode === 'analysis' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500")}><BrainCircuit size={14} /> Análisis</button>
                </div>
            )}

            {reports.length === 0 && <div className="text-center py-10 bg-gray-50 text-gray-500 text-xs">Sin informes cerrados</div>}

            {viewMode === 'single' && currentReport && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Periodo Cerrado</label>
                        <select className="w-full p-2 bg-gray-50 rounded-lg text-slate-700 outline-none border-transparent focus:border-brand-500" value={currentReport.id} onChange={e => setSelectedReportId(e.target.value)}>
                            {reports.map(r => <option key={r.id} value={r.id}>{getPeriodLabel(r)}</option>)}
                        </select>
                    </div>
                    <Card className="p-4 bg-slate-900 text-white border-none shadow-xl">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Resumen Global</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-xs text-slate-400">Presupuesto</p><p className="text-lg font-bold">€ {formatTotal(currentReport.totalGlobalPresupuesto)}</p></div>
                            <div className="text-right"><p className="text-xs text-slate-400">Gasto Real</p><p className="text-lg font-bold text-red-300">-€ {formatTotal(currentReport.totalGlobalGasto)}</p></div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-300">Diferencia</span>
                            <span className={`text-xl font-bold ${currentReport.totalGlobalDiferencia >= 0 ? 'text-green-400' : 'text-red-400'}`}>{currentReport.totalGlobalDiferencia >= 0 ? '+' : ''}€ {formatTotal(currentReport.totalGlobalDiferencia)}</span>
                        </div>
                    </Card>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div role="row" className="grid grid-cols-12 bg-gray-50 p-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                            <div className="col-span-4" onClick={() => handleSort('categoryName')}>Categoría</div>
                            <div className="col-span-2 text-right" onClick={() => handleSort('presupuesto')}>Ppto</div>
                            <div className="col-span-3 text-right" onClick={() => handleSort('gastoReal')}>Gasto</div>
                            <div className="col-span-3 text-right" onClick={() => handleSort('variation')}>% Var</div>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {sortedDetails.map(d => {
                                const percent = d.presupuesto > 0 ? (d.gastoReal / d.presupuesto) * 100 : 0;
                                const isOver = percent > 100;
                                const diff = percent - 100;
                                return (
                                    <div key={d.categoryId} className="grid grid-cols-12 p-3 text-sm items-center hover:bg-gray-50">
                                        <div className="col-span-4 font-medium text-slate-700 truncate pr-1 text-xs">{d.categoryName}</div>
                                        <div className="col-span-2 text-right text-gray-500 text-xs">{formatTotal(d.presupuesto)}</div>
                                        <div className="col-span-3 text-right font-bold text-slate-800 text-xs">{formatTotal(d.gastoReal)}</div>
                                        <div className={`col-span-3 text-right text-[10px] font-bold ${isOver ? 'text-red-500' : 'text-green-500'}`}>{isOver ? '+' : ''}{diff.toFixed(0)}%</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'history' && reports.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                    {renderChart()}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-[10px] text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-3 py-3 font-bold sticky left-0 bg-gray-50 z-10 w-24 border-r border-gray-100 shadow-sm">Categoría</th>
                                        {historyPeriods.map(p => <th key={p.id} className="px-3 py-3 font-bold text-center min-w-[70px]">{getPeriodLabel(p, true)}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {allCategories.map(catName => (
                                        <tr key={catName} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 font-medium text-slate-700 sticky left-0 bg-white z-10 border-r border-gray-100 shadow-sm truncate max-w-[80px]" title={catName}>{catName}</td>
                                            {historyPeriods.map(p => {
                                                const detail = p.detalles.find(d => d.categoryName === catName);
                                                return <td key={p.id} className="px-3 py-2 text-right text-xs text-slate-600 tabular-nums">{detail && detail.gastoReal > 0 ? formatTotal(detail.gastoReal) : '-'}</td>;
                                            })}
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-50 font-bold border-t border-gray-200">
                                        <td className="px-3 py-3 text-slate-800 sticky left-0 bg-slate-50 z-10 border-r border-gray-200">TOTAL</td>
                                        {historyPeriods.map(p => (
                                            <td key={p.id} className="px-3 py-3 text-right text-xs text-slate-900 tabular-nums">€{formatTotal(p.totalGlobalGasto)}</td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'analysis' && analysis && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                    {/* 1. ANÁLISIS DEL ÚLTIMO PERIODO (TOP 3) */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><PieChart size={16} className="text-blue-500"/> Último Cierre ({getPeriodLabel(analysis.recentPeriods[analysis.recentPeriods.length -1], true)})</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-2">Mayores Desvíos</span>
                                {(() => {
                                    const lastP = analysis.recentPeriods[analysis.recentPeriods.length - 1];
                                    const over = [...lastP.detalles].sort((a,b) => (b.gastoReal - b.presupuesto) - (a.gastoReal - a.presupuesto)).filter(x => x.gastoReal > x.presupuesto).slice(0,3);
                                    if (over.length === 0) return <p className="text-xs text-slate-500">Sin desvíos</p>;
                                    return (
                                        <div className="space-y-1.5">
                                            {over.map(o => (
                                                <div key={o.categoryId} className="flex justify-between items-center text-xs">
                                                    <span className="font-medium text-slate-700 truncate max-w-[70px]">{o.categoryName}</span>
                                                    <span className="text-red-600 font-bold">+{formatTotal(o.gastoReal - o.presupuesto)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                })()}
                            </div>
                            <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider block mb-2">Mejores Ahorros</span>
                                {(() => {
                                    const lastP = analysis.recentPeriods[analysis.recentPeriods.length - 1];
                                    const save = [...lastP.detalles].sort((a,b) => (a.gastoReal - a.presupuesto) - (b.gastoReal - b.presupuesto)).filter(x => x.gastoReal < x.presupuesto).slice(0,3);
                                    if (save.length === 0) return <p className="text-xs text-slate-500">Sin ahorros</p>;
                                    return (
                                        <div className="space-y-1.5">
                                            {save.map(s => (
                                                <div key={s.categoryId} className="flex justify-between items-center text-xs">
                                                    <span className="font-medium text-slate-700 truncate max-w-[70px]">{s.categoryName}</span>
                                                    <span className="text-green-600 font-bold">{formatTotal(s.presupuesto - s.gastoReal)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* 2. TENDENCIA TRIMESTRAL */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-indigo-500"/> Tendencia (3 Meses)</h3>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                            {(() => {
                                const last3 = analysis.recentPeriods.slice(-3);
                                const avg3 = last3.reduce((a,b) => a + b.totalGlobalGasto, 0) / 3;
                                const diffToBudget = avg3 - TOTAL_BUDGET;
                                const isGood = diffToBudget <= 0;
                                return (
                                    <>
                                        <div><p className="text-xs text-gray-500">Gasto Promedio</p><p className="text-xl font-bold text-slate-800">{formatTotal(avg3)} €</p></div>
                                        <div className={`text-right ${isGood ? 'text-green-500' : 'text-red-500'}`}>
                                            <p className="text-xs font-medium uppercase">{isGood ? 'Bajo Control' : 'Atención'}</p>
                                            <p className="text-sm font-bold">{isGood ? '' : '+'}{formatTotal(diffToBudget)} € vs Ppto</p>
                                        </div>
                                    </>
                                )
                            })()}
                        </div>
                    </div>

                    {/* 3. SUGERENCIAS DE AJUSTE (IA REBALANCEO) */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><BrainCircuit size={16} className="text-purple-500"/> Rebalanceo Sugerido (Suma Cero)</h3>
                        
                        {analysis.overBudgetItems.length === 0 && analysis.underBudgetItems.length === 0 ? (
                            <div className="bg-gray-50 p-4 rounded-xl text-center text-xs text-gray-500">Tus presupuestos están equilibrados.</div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="grid grid-cols-2 divide-x divide-gray-100">
                                    <div className="p-3 space-y-2">
                                        <span className="text-[10px] font-bold text-red-400 uppercase block mb-1">Subir Presupuesto</span>
                                        {analysis.overBudgetItems.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center text-xs">
                                                <span className="text-slate-600 truncate max-w-[80px]">{item.name}</span>
                                                <span className="font-bold text-slate-800 bg-red-50 px-1.5 py-0.5 rounded">+{formatTotal(item.suggestedChange)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 space-y-2 bg-gray-50/50">
                                        <span className="text-[10px] font-bold text-green-500 uppercase block mb-1">Bajar para Compensar</span>
                                        {analysis.underBudgetItems.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center text-xs">
                                                <span className="text-slate-600 truncate max-w-[80px]">{item.name}</span>
                                                <span className="font-bold text-slate-800 bg-green-50 px-1.5 py-0.5 rounded">{formatTotal(item.suggestedChange)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-purple-50 p-2 text-center border-t border-purple-100">
                                    <p className="text-[10px] text-purple-700 font-medium">Impacto Total en Presupuesto: 0 €</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
};