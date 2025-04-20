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
  const [estados, setEstados] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [conversacion, setConversacion] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: estadosData } = await supabase.from('estados_crm').select('nombre_estado');
      setEstados(estadosData?.map((e) => e.nombre_estado) || []);

      const { data: leadsData } = await supabase.from('leads').select('*');
      setLeads(leadsData || []);
    };
    fetchData();
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
      .update({ ...formData, fecha_update: new Date().toISOString(), usuario_update: 'CRM' })
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

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {!selectedLead ? (
        <div className="p-6 grid grid-cols-4 gap-4">
          {[...estados, 'Sin estado'].map((estado) => (
            <div key={estado}>
              <h3 className="text-lg font-bold mb-2">{estado}</h3>
              {leads.filter((l) => l.estado === estado || (!l.estado && estado === 'Sin estado')).map((lead) => (
                <Card
                  key={lead.id}
                  onClick={() => handleSelectLead(lead)}
                  className="mb-2 p-4 cursor-pointer bg-gray-800 hover:bg-gray-700 transition rounded-xl"
                >
                  <p className="font-semibold">{lead.nombre || 'Sin nombre'}</p>
                  <p className="text-sm text-gray-400">{lead.estado || 'Nuevo'}</p>
                </Card>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-12 h-screen overflow-hidden">
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
            {Object.entries(formData).map(([key, value]) => {
              if (!camposExcluidos.includes(key)) {
                return (
                  <div key={key} className="flex items-center justify-between mb-3">
                    <label className="text-sm text-gray-400 capitalize mr-2 w-1/3">{key}</label>
                    {key === 'intervencion_humana' ? (
                      <input
                        type="checkbox"
                        checked={!!formData[key]}
                        onChange={(e) => handleChange(key, e.target.checked)}
                        className="w-5 h-5"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData[key] ?? ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-2/3 p-2 rounded bg-gray-800 text-white"
                      />
                    )}
                  </div>
                );
              }
              return null;
            })}
            <Button onClick={handleGuardar} className="w-full bg-green-600 mt-2 rounded-full">
              Guardar
            </Button>
            {!selectedLead.intervencion_humana && (
              <Button onClick={handleTomarConversacion} className="w-full mt-2 bg-blue-600 rounded-full">
                Tomar conversación
              </Button>
            )}
          </div>

          <div className="col-span-8 bg-gray-950 p-4 overflow-auto">
            <h3 className="text-xl font-bold mb-4">💬 Conversación</h3>
            <div className="space-y-2 max-h-[calc(100vh-160px)] overflow-y-auto pr-4 mb-4">
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
            {selectedLead?.intervencion_humana && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribí tu respuesta..."
                  className="flex-1 p-2 rounded bg-gray-800 text-white"
                />
                <Button className="rounded-full bg-blue-600">Enviar</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


