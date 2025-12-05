import React, { useEffect, useState, useRef } from 'react';
import { Button, Card, Input, calculatePeriodInfo } from '../components/Components';
import { Layers, PieChart, ShieldCheck, Download, Upload, AlertTriangle, FileSpreadsheet, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ClosingConfig, MonthlyExpense } from '../types';
import { getClosingConfig, saveClosingConfig, generateClosingReport, getMonthlyReports } from '../services/db';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

export const Settings = () => {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem('currentUser');
  const [closingConfig, setClosingConfig] = useState<ClosingConfig>({ tipo: 'diaFijo', diaFijo: 11 }); 
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showForceConfirm, setShowForceConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [periodLabel, setPeriodLabel] = useState('');
  const [lastBackupInfo, setLastBackupInfo] = useState<{user: string, date: string} | null>(null);

  useEffect(() => {
    initData();
    loadBackupInfo();
  }, []);

  const loadBackupInfo = () => {
      const savedInfo = localStorage.getItem('last_backup_info');
      if (savedInfo) {
          setLastBackupInfo(JSON.parse(savedInfo));
      }
  };

  const initData = async () => {
    const [config, reports] = await Promise.all([getClosingConfig(), getMonthlyReports()]);
    setClosingConfig(config);

    const diaCierre = config.diaFijo || 11;
    const theoreticalPeriod = calculatePeriodInfo(new Date(), diaCierre);
    
    const sortedReports = reports.sort((a, b) => new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime());
    const lastReport = sortedReports.length > 0 ? sortedReports[0] : null;

    let realStartDate = theoreticalPeriod.startDate;
    let periodNumber = theoreticalPeriod.periodNumber;
    
    if (lastReport) {
        const lastEnd = new Date(lastReport.fechaFin);
        lastEnd.setHours(12, 0, 0, 0); 
        const nextStart = addDays(lastEnd, 1);
        nextStart.setHours(0, 0, 0, 0);
        realStartDate = nextStart;
        periodNumber = (lastReport.numeroPeriodo || 0) + 1;
    }

    let nextClosingDate = new Date(realStartDate.getFullYear(), realStartDate.getMonth(), diaCierre);
    if (nextClosingDate.getTime() < realStartDate.getTime()) {
        nextClosingDate = new Date(realStartDate.getFullYear(), realStartDate.getMonth() + 1, diaCierre);
    }
    
    setPeriodLabel(`PERIODO ACTIVO: P${periodNumber} (${format(realStartDate, 'd MMM', { locale: es })} - ${format(nextClosingDate, 'd MMM', { locale: es })})`.toUpperCase());
  };

  const handleSaveConfig = async () => {
      setSaving(true);
      await saveClosingConfig(closingConfig);
      await initData();
      setSaving(false);
      setSaveMessage('Guardado');
      setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleForceClose = async () => {
      try {
        setSaving(true); 
        await generateClosingReport(new Date());
        setSaveMessage('Cierre Exitoso');
        setTimeout(() => {
            setShowForceConfirm(false);
            navigate('/reports');
        }, 1000);
      } catch (error) {
        console.error("Error al forzar cierre:", error);
        setSaveMessage('Error al cerrar');
      } finally {
        setSaving(false);
      }
  };

  // --- EXPORTAR A EXCEL (CSV) ---
  const handleExportExcel = () => {
    const expensesStr = localStorage.getItem('monthly_expenses');
    if (!expensesStr) {
        alert("No hay gastos registrados para exportar.");
        return;
    }
    const expenses: MonthlyExpense[] = JSON.parse(expensesStr);

    let csvContent = "Fecha;Categoría;Descripción;Monto;Usuario\n";

    expenses.forEach(e => {
        const date = new Date(e.fecha).toLocaleDateString('es-ES');
        const desc = (e.descripcion || "").replace(/;/g, ",").replace(/[\r\n]+/g, " ");
        const amount = e.monto.toString().replace('.', ',');
        csvContent += `${date};${e.categoria};${desc};${amount};${e.creado_por_usuario_id}\n`;
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // CAMBIO DE NOMBRE AQUÍ
    a.download = `GastApp_Excel_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- SISTEMA DE BACKUP COMPLETO (JSON) ---
  const handleExportData = () => {
      const now = new Date();
      const exportInfo = {
          user: currentUser,
          date: now.toISOString()
      };

      const data = {
          meta: exportInfo,
          monthly_expenses: localStorage.getItem('monthly_expenses'),
          categories: localStorage.getItem('categories'),
          monthly_reports: localStorage.getItem('monthly_reports'),
          closing_config: localStorage.getItem('closing_config'),
          currentUser: localStorage.getItem('currentUser'),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // CAMBIO DE NOMBRE AQUÍ
      a.download = `GastApp_Respaldo_${currentUser}_${format(now, 'yyyy-MM-dd_HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      localStorage.setItem('last_backup_info', JSON.stringify(exportInfo));
      setLastBackupInfo(exportInfo);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const data = JSON.parse(content);

              if (!data.monthly_expenses && !data.categories) {
                  alert("El archivo no parece ser un respaldo válido de GastApp.");
                  return;
              }

              let confirmMsg = "ADVERTENCIA: Esto reemplazará TODOS los datos actuales.";
              if (data.meta) {
                  const dateStr = format(new Date(data.meta.date), 'dd/MM/yyyy HH:mm');
                  confirmMsg += `\n\nEstás a punto de cargar una copia hecha por: ${data.meta.user}\nFecha: ${dateStr}`;
              }
              confirmMsg += "\n\n¿Estás seguro de continuar?";

              if (window.confirm(confirmMsg)) {
                  if (data.monthly_expenses) localStorage.setItem('monthly_expenses', data.monthly_expenses);
                  if (data.categories) localStorage.setItem('categories', data.categories);
                  if (data.monthly_reports) localStorage.setItem('monthly_reports', data.monthly_reports);
                  if (data.closing_config) localStorage.setItem('closing_config', data.closing_config);
                  if (data.currentUser) localStorage.setItem('currentUser', data.currentUser);
                  
                  alert("Datos restaurados correctamente. La aplicación se reiniciará.");
                  window.location.reload();
              }
          } catch (error) {
              console.error("Error importing:", error);
              alert("Error al leer el archivo. Asegúrate de que sea un .json válido.");
          }
      };
      reader.readAsText(file);
      event.target.value = '';
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/onboarding');
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex flex-col items-end">
        <h1 className="text-2xl font-bold text-slate-900 w-full">Ajustes</h1>
        <div className="bg-blue-50 px-2 py-1 rounded-md mt-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{periodLabel}</span>
        </div>
      </div>
      
      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex gap-3 items-start">
         <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
         <p className="text-xs text-emerald-800 leading-tight">
            <strong>Nota:</strong> Los cambios en presupuestos solo afectan al periodo actual y futuros.
         </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
         <div><p className="text-sm text-gray-500">Usuario</p><p className="text-xl font-bold text-blue-600">{currentUser}</p></div>
         <Button variant="outline" size="sm" onClick={handleLogout}>Salir</Button>
      </div>

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2">Finanzas</h3>
      <Card className="p-0 overflow-hidden border border-gray-100">
         <div onClick={() => navigate('/budgets')} role="button" tabIndex={0} className="p-4 border-b border-gray-50 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
            <Layers size={20} className="text-blue-600" aria-hidden="true"/> 
            <div className="flex-1">
                <span className="font-medium text-slate-700 block">Categorías y Presupuestos</span>
                <span className="text-xs text-slate-400">Define tus límites para el periodo actual</span>
            </div>
         </div>
         <div onClick={() => navigate('/reports')} role="button" tabIndex={0} className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
            <PieChart size={20} className="text-indigo-600" aria-hidden="true"/> <span className="font-medium text-slate-700">Informes Históricos</span>
         </div>
      </Card>

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2">Datos y Seguridad</h3>
      <Card className="p-4 space-y-4 border-l-4 border-l-orange-400">
         <div className="flex gap-3 items-start">
            <AlertTriangle size={18} className="text-orange-500 shrink-0" />
            <div className="text-xs text-gray-600">
                <p className="mb-1">Tus datos viven solo en este teléfono. No hay sincronización automática.</p>
                <p className="font-semibold text-orange-700">Para compartir datos con otra persona, debes enviarle el archivo de respaldo.</p>
            </div>
         </div>

         {lastBackupInfo && (
             <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-gray-50 p-2 rounded-lg">
                 <Clock size={12} /> 
                 <span>Último respaldo: {format(new Date(lastBackupInfo.date), 'dd/MM HH:mm')} por {lastBackupInfo.user}</span>
             </div>
         )}
         
         <div className="grid grid-cols-2 gap-3">
             <Button variant="outline" className="flex flex-col h-auto py-3 gap-2 col-span-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100" onClick={handleExportExcel}>
                 <FileSpreadsheet size={20} />
                 <span className="text-xs font-bold">Descargar Excel (CSV)</span>
             </Button>

             <Button variant="outline" className="flex flex-col h-auto py-3 gap-2" onClick={handleExportData}>
                 <Download size={20} className="text-slate-600" />
                 <span className="text-xs font-bold">Guardar Copia</span>
             </Button>
             
             <Button variant="outline" className="flex flex-col h-auto py-3 gap-2" onClick={handleImportClick}>
                 <Upload size={20} className="text-slate-600" />
                 <span className="text-xs font-bold">Cargar Copia</span>
             </Button>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
         </div>
      </Card>

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2">Cierre Mensual</h3>
      <Card className="p-4 space-y-4">
        <div className="flex gap-2" role="group" aria-label="Tipo de cierre">
            <button onClick={() => setClosingConfig({ ...closingConfig, tipo: 'ultimoDia' })} aria-pressed={closingConfig.tipo === 'ultimoDia'} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${closingConfig.tipo === 'ultimoDia' ? 'border-blue-500 bg-white text-blue-600' : 'border-gray-200 text-gray-500'}`}>Fin de mes</button>
            <button onClick={() => setClosingConfig({ ...closingConfig, tipo: 'diaFijo' })} aria-pressed={closingConfig.tipo === 'diaFijo'} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${closingConfig.tipo === 'diaFijo' ? 'border-blue-500 bg-white text-blue-600' : 'border-gray-200 text-gray-500'}`}>Día fijo</button>
        </div>
        {closingConfig.tipo === 'diaFijo' && (
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <label htmlFor="closing-day" className="text-sm font-medium text-slate-700">Día de cierre:</label>
                <Input id="closing-day" type="number" min={1} max={28} className="w-16 h-10 text-center p-0" value={closingConfig.diaFijo} onChange={e => setClosingConfig({ ...closingConfig, diaFijo: parseInt(e.target.value) })} />
            </div>
        )}
        <Button onClick={handleSaveConfig} disabled={saving}>{saving ? 'Guardando...' : (saveMessage || 'Guardar Configuración')}</Button>
        <div className="pt-4 border-t border-gray-100">
             {!showForceConfirm ? (
                 <Button variant="ghost" className="w-full text-red-500 hover:bg-red-50" onClick={() => setShowForceConfirm(true)}>Forzar cierre de mes ahora</Button>
             ) : (
                 <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center space-y-3" role="alert">
                     <p className="text-sm text-red-700 font-medium">¿Estás seguro? Se generará un reporte estático con los datos actuales.</p>
                     <div className="flex gap-2">
                        <Button variant="secondary" size="sm" className="flex-1" onClick={() => setShowForceConfirm(false)}>Cancelar</Button>
                        <Button variant="danger" size="sm" className="flex-1" onClick={handleForceClose} disabled={saving}>{saving ? 'Cerrando...' : 'Sí, Cerrar'}</Button>
                     </div>
                 </div>
             )}
        </div>
      </Card>
    </div>
  );
};