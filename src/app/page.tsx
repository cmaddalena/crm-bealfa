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
  const [estados, setEstados] = useState<string[]>([]);
  const [colores, setColores] = useState<any>({});
  const [formState, setFormState] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchData = async () => {
      const { data: leadsData } = await supabase.from('leads').select('*');
      const { data: estadosData } = await supabase.from('estados_crm').select('nombre_estado');
      const { data: config } = await supabase.from('config').select('*').single();

      setLeads(leadsData || []);
      setEstados(estadosData?.map(e => e.nombre_estado) || []);
      setColores({
        fondo: config?.color_fondo || '#0f172a',
        texto: config?.color_texto || '#ffffff',
        botones: config?.color_botones || '#3b82f6',
        acento: config?.color_ascento || '#9333ea',
      });
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
    await supabase.from('leads').update(formData).eq('id', formData.id);
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
    <div style={{ backgroundColor: colores.fondo }} className="min-h-screen p-6 text-white">
      <header className="flex justify-between items-center mb-6">
        <img src="/logo.png" alt="Logo" className="h-10 cursor-pointer" />
        <h1 style={{ color: colores.acento }} className="text-2xl font-bold">CRM BEALFA</h1>
      </header>

      {!selectedLead ? (
        <div className="grid grid-cols-4 gap-4">
          {estados.map((estado) => (
            <div key={estado} className="bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-2">{estado}</h2>
              {leads.filter((lead) => lead.estado === estado).map((lead) => (
                <Card
                  key={lead.id}
                  onClick={() => handleSelectLead(lead)}
                  className="mb-2 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                >
                  <p className="font-bold">{lead.nombre || 'Sin nombre'}</p>
                  <p className="text-sm">{lead.telefono || 'Sin teléfono'}</p>
                </Card>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* Panel izquierdo - Datos */}
          <div className="col-span-1 bg-gray-900 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{selectedLead.nombre}</h3>
              <button onClick={() => setSelectedLead(null)} className="text-red-400">Cerrar ✖️</button>
            </div>

            {editableFields.map((key) => (
              <div key={key} className="mb-2 flex items-center justify-between">
                <label className="capitalize text-sm w-1/2 text-gray-400">{key.replace(/_/g, ' ')}</label>
                {key === 'intervencion_humana' ? (
                  <input type="checkbox" checked={formData[key] || false} onChange={(e) => handleChange(key, e.target.checked)} />
                ) : (
                  <input
                    type="text"
                    value={formData[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="p-1 bg-gray-800 rounded w-1/2"
                  />
                )}
              </div>
            ))}

            <Button className="mt-4 w-full bg-green-600 rounded-full" onClick={handleGuardar}>Guardar</Button>
            {!selectedLead.intervencion_humana && (
              <Button className="mt-2 w-full bg-blue-600 rounded-full" onClick={handleTomarConversacion}>
                Tomar conversación
              </Button>
            )}
          </div>

          {/* Panel derecho - Conversación */}
          <div className="col-span-2 bg-gray-900 p-4 rounded-lg flex flex-col">
            <h3 className="text-xl font-bold mb-4">💬 Conversación</h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {conversacion.map((msg, index) => (
                <div
                  key={index}
                  className={`max-w-[70%] p-3 rounded-xl ${
                    msg.tipo === 'entrada' ? 'bg-gray-800 text-left' : 'bg-green-600 ml-auto text-right'
                  }`}
                >
                  <p>{msg.mensaje}</p>
                  <p className="text-xs mt-1 text-gray-300">{new Date(msg.timestamp_in || msg.timestamp_out).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
            {selectedLead.intervencion_humana && (
              <div className="mt-4">
                <textarea
                  placeholder="Escribí una respuesta..."
                  className="w-full p-2 bg-gray-800 rounded resize-none"
                />
                <Button className="mt-2 bg-blue-600 w-full rounded-full">Enviar</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
