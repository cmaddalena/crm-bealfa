'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CRMApp() {
  const [leads, setLeads] = useState<any[]>([]);
  const [estadosCRM, setEstadosCRM] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [conversacion, setConversacion] = useState<any[]>([]);

  useEffect(() => {
    const fetchConfigAndLeads = async () => {
      const { data: config } = await supabase.from('config').select('estados_crm').single();
      const estados = config?.estados_crm?.split(',') || ['Nuevo'];
      setEstadosCRM(estados);

      const { data: leadsData } = await supabase.from('leads').select('*');
      setLeads(leadsData || []);
    };

    fetchConfigAndLeads();
  }, []);

  const handleSelectLead = async (lead: any) => {
    setSelectedLead(lead);
    setFormData(lead);
    const { data } = await supabase
      .from('conversaciones')
      .select('*')
      .eq('lead_id', lead.id)
      .order('timestamp_in', { ascending: true });
    setConversacion(data || []);
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleGuardar = async () => {
    await supabase
      .from('leads')
      .update({
        ...formData,
        fecha_update: new Date().toISOString(),
        usuario_update: 'CRM',
      })
      .eq('id', formData.id);
    setSelectedLead(null);
  };

  const handleTomarConversacion = async () => {
    await supabase
      .from('leads')
      .update({ intervencion_humana: true })
      .eq('id', formData.id);
    setSelectedLead({ ...formData, intervencion_humana: true });
  };

  const camposExcluidos = ['id', 'fecha_creacion', 'usuario_update', 'fecha_update'];
  const editableFields = Object.keys(formData || {}).filter((key) => !camposExcluidos.includes(key));

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <h1 className="text-2xl font-bold p-6">📋 CRM Kanban</h1>
      <div className="grid grid-cols-5 gap-4 px-6">
        {estadosCRM.map((estado) => (
          <div key={estado} className="bg-gray-900 p-4 rounded-lg shadow-md border border-gray-800">
            <h2 className="text-lg font-semibold mb-3">{estado}</h2>
            {leads
              .filter((lead) => (lead.estado || 'Nuevo') === estado)
              .map((lead) => (
                <Card
                  key={lead.id}
                  onClick={() => handleSelectLead(lead)}
                  className="mb-3 p-3 bg-gray-800 hover:bg-gray-700 cursor-pointer rounded"
                >
                  <p className="font-semibold">{lead.nombre || 'Sin nombre'}</p>
                  <p className="text-sm text-gray-400">{lead.canal}</p>
                </Card>
              ))}
          </div>
        ))}
      </div>

      {/* Modal de Detalle del Lead */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-xl w-[90vw] h-[90vh] p-6 grid grid-cols-12 gap-4">
            {/* Panel Izquierdo: Datos */}
            <div className="col-span-4 overflow-auto border-r border-gray-700 pr-4">
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-bold">{formData.nombre}</h2>
                <button onClick={() => setSelectedLead(null)}>❌</button>
              </div>
              {editableFields.map((key) => (
                <div key={key} className="mb-3">
                  <label className="text-sm text-gray-400 capitalize">{key}</label>
                  <input
                    type="text"
                    value={formData[key] ?? ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={key}
                    className="w-full p-2 rounded bg-gray-800 text-white"
                  />
                </div>
              ))}
              <Button onClick={handleGuardar} className="w-full bg-green-600 mt-2">
                Guardar
              </Button>
              {!selectedLead.intervencion_humana && (
                <Button onClick={handleTomarConversacion} className="w-full mt-2 bg-blue-600">
                  Tomar conversación
                </Button>
              )}
            </div>

            {/* Panel Derecho: Conversación */}
            <div className="col-span-8 flex flex-col">
              <h3 className="text-lg font-semibold mb-3">💬 Conversación</h3>
              <div className="overflow-y-auto space-y-2 pr-3">
                {conversacion.length === 0 ? (
                  <p className="text-gray-500">Sin mensajes aún...</p>
                ) : (
                  conversacion.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg w-fit max-w-[75%] ${
                        msg.tipo === 'entrada'
                          ? 'bg-gray-800 self-start'
                          : 'bg-green-700 self-end ml-auto'
                      }`}
                    >
                      <p>{msg.mensaje}</p>
                      <p className="text-xs text-gray-300 mt-1 text-right">
                        {new Date(msg.timestamp_in || msg.timestamp_out).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
