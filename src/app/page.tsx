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
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [conversacion, setConversacion] = useState<any[]>([]);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const { data } = await supabase.from('leads').select('*');
    setLeads(data || []);
  };

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
    await supabase.from('leads').update(formData).eq('id', formData.id);
    fetchLeads();
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
  const editableFields = Object.keys(selectedLead || {}).filter(
    (key) => !camposExcluidos.includes(key)
  );

  return (
    <div className="min-h-screen grid grid-cols-12 bg-gray-950 text-white font-sans">
      {/* Sidebar Kanban */}
      <div className="col-span-3 p-4 border-r border-gray-700">
        <h2 className="text-xl font-bold mb-4">🗂 Leads</h2>
        {leads.map((lead) => (
          <Card
            key={lead.id}
            onClick={() => handleSelectLead(lead)}
            className="mb-2 p-4 cursor-pointer bg-gray-800 hover:bg-gray-700 transition rounded"
          >
            <p className="font-semibold">{lead.nombre || 'Sin nombre'}</p>
            <p className="text-sm text-gray-400">{lead.estado || 'Nuevo'}</p>
          </Card>
        ))}
      </div>

      {/* Conversación & Datos */}
      {selectedLead ? (
        <div className="col-span-9 grid grid-cols-12 h-screen overflow-hidden">
          {/* Datos Lead */}
          <div className="col-span-4 bg-gray-900 p-4 overflow-auto border-r border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedLead?.nombre}</h3>
              <button
                className="text-red-500 hover:text-red-400"
                onClick={() => setSelectedLead(null)}
              >
                ❌
              </button>
            </div>

            {Object.entries(formData).map(([key, value]) =>
              !camposExcluidos.includes(key) ? (
                <div key={key} className="mb-3">
                  <label className="text-sm text-gray-400 capitalize">{key}</label>
                  <input
                    type="text"
                    value={typeof value === 'string' || typeof value === 'number' ? value : ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
                    className="w-full p-2 rounded bg-gray-800 text-white mb-2"
                  />
                </div>
              ) : null
            )}

            <Button onClick={handleGuardar} className="w-full bg-green-600 mt-2">
              Guardar
            </Button>
            {!selectedLead.intervencion_humana && (
              <Button onClick={handleTomarConversacion} className="w-full mt-2 bg-blue-600">
                Tomar conversación
              </Button>
            )}
          </div>

          {/* Conversación */}
          <div className="col-span-8 bg-gray-950 p-4 overflow-auto">
            <h3 className="text-xl font-bold mb-4">💬 Conversación</h3>
            <div className="space-y-2 max-h-[calc(100vh-100px)] overflow-y-auto pr-4 scroll-smooth">
              {conversacion.length === 0 && (
                <p className="text-gray-500">Sin mensajes aún...</p>
              )}
              {conversacion.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg w-fit max-w-[80%] ${
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
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="col-span-9 p-8 text-gray-400 text-center flex items-center justify-center">
          <p>👈 Seleccioná un lead para ver su conversación</p>
        </div>
      )}
    </div>
  );
}
