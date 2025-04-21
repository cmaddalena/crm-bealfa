
'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEstados = async () => {
      const { data } = await supabase.from('estados_crm').select('nombre_estado');
      setEstados(data?.map((e) => e.nombre_estado) || []);
    };

    const fetchLeads = async () => {
      const { data } = await supabase.from('leads').select('*');
      setLeads(data || []);
    };

    fetchEstados();
    fetchLeads();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversacion]);

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
    if (field === 'intervencion_humana') {
      supabase.from('leads').update({ [field]: value }).eq('id', formData.id);
    }
  };

  const handleGuardar = async () => {
    await supabase.from('leads').update(formData).eq('id', formData.id);
    setLeads((prev) => prev.map((l) => (l.id === formData.id ? formData : l)));
    setSelectedLead(null);
  };

  const handleSendMessage = async () => {
    if (!nuevoMensaje.trim()) return;

    const mensaje = {
      lead_id: formData.id,
      mensaje_out: nuevoMensaje,
      tipo: 'salida',
      autor: 'humano',
      timestamp_out: new Date().toISOString(),
    };

    await supabase.from('conversaciones').insert(mensaje);
    setConversacion((prev) => [...prev, mensaje]);
    setNuevoMensaje('');
  };

  const handleDrop = async (e: React.DragEvent, estado: string) => {
    const id = e.dataTransfer.getData('text/plain');
    await supabase.from('leads').update({ estado }).eq('id', id);
    const { data } = await supabase.from('leads').select('*');
    setLeads(data || []);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const camposExcluidos = ['id', 'fecha_creacion', 'usuario_update', 'fecha_update'];

  const canalColor = (canal: string) => {
    if (canal?.toLowerCase().includes('whatsapp')) return 'bg-green-600';
    if (canal?.toLowerCase().includes('instagram')) return 'bg-pink-600';
    return 'bg-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans p-4">
      {selectedLead ? (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4 bg-gray-900 p-4 rounded-xl max-h-screen overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{formData.nombre || 'Lead'}</h3>
              <button
                className="text-red-500 hover:text-red-400"
                onClick={() => setSelectedLead(null)}
              >
                ❌
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(formData)
                .filter(([key]) => !camposExcluidos.includes(key))
                .map(([key, value]) => (
                  <div key={key} className="col-span-2">
                    <label className="text-sm text-gray-400 capitalize">{key}</label>
                    {key === 'intervencion_humana' ? (
                      <input
                        type="checkbox"
                        checked={value === true}
                        onChange={(e) => handleChange(key, e.target.checked)}
                        className="ml-2"
                      />
                    ) : (
                      <input
                        type="text"
                        value={String(value ?? '')}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full p-2 rounded bg-gray-800 text-white"
                      />
                    )}
                  </div>
                ))}
            </div>
            <Button onClick={handleGuardar} className="w-full mt-4 bg-green-600 rounded-full">
              Guardar
            </Button>
          </div>

          <div className="col-span-8 flex flex-col bg-gray-900 p-4 rounded-xl max-h-screen">
            <h3 className="text-xl font-bold mb-4">💬 Conversación</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {conversacion.map((msg, i) => {
                const isEntrada = msg.mensaje_in;
                const isBot = msg.autor === 'bot';
                const isHumano = msg.autor === 'humano';

                if (msg.mensaje_in) {
                  return (
                    <div key={`${i}-in`} className="p-3 bg-green-700 rounded-lg w-fit max-w-[80%] self-start">
                      <p>{msg.mensaje_in}</p>
                      <p className="text-xs text-gray-300 mt-1 text-right">{new Date(msg.timestamp_in).toLocaleString()}</p>
                    </div>
                  );
                }

                if (msg.mensaje_out) {
                  const bgColor = isBot ? 'bg-gray-600' : 'bg-blue-600';
                  return (
                    <div key={`${i}-out`} className={`p-3 ${bgColor} rounded-lg w-fit max-w-[80%] self-end ml-auto`}>
                      <p>{msg.mensaje_out}</p>
                      <p className="text-xs text-gray-300 mt-1 text-right">{new Date(msg.timestamp_out || msg.timestamp_in).toLocaleString()}</p>
                    </div>
                  );
                }

                return null;
              })}
              <div ref={chatEndRef} />
            </div>
            {formData.intervencion_humana && (
              <div className="flex gap-2 mt-4 items-center">
                <input
                  type="text"
                  placeholder="Escribí tu mensaje..."
                  className="flex-1 p-2 rounded-full bg-gray-800 text-white"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} className="bg-blue-600 rounded-full">
                  Enviar
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-4">
          {[...estados, 'Sin estado'].map((estado) => (
            <div
              key={estado}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, estado)}
              className="bg-gray-900 rounded-xl p-4 min-h-[300px]"
            >
              <h3 className="text-lg font-bold mb-2">{estado}</h3>
              {leads
                .filter((lead) => lead.estado === estado || (!lead.estado && estado === 'Sin estado'))
                .map((lead) => (
                  <Card
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onClick={() => handleSelectLead(lead)}
                    className="mb-2 p-3 bg-gray-800 cursor-pointer hover:bg-gray-700 transition rounded-lg"
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">{lead.nombre || 'Sin nombre'}</p>
                      <span className={`text-xs text-white px-2 py-1 rounded-full ${canalColor(lead.canal || '')}`}>
                        {lead.canal}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{lead.estado || 'Nuevo'}</p>
                  </Card>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
