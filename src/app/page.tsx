// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent } from './components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Button } from './components/ui/button';

interface Lead {
  id: string;
  nombre?: string;
  canal?: string;
  telefono?: string;
  estado?: string;
  usuario_instagram?: string;
  personalidad?: string;
  facturacion?: string;
  tamaño_negocio?: string;
  dolor_principal?: string;
  industria?: string;
  origen?: string;
  referido_id?: string;
  notas?: string;
  tipo_cliente?: 'A' | 'B' | 'C';
  intervencion_humana?: boolean;
}

interface Config {
  segundos_rpta_ia: number;
}

interface Conversacion {
  mensaje_in: string;
  mensaje_out?: string;
  timestamp_in: string;
  timestamp_out?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CRMApp() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [mensajeEditado, setMensajeEditado] = useState('');

  useEffect(() => {
    const fetchLeads = async () => {
      const { data } = await supabase.from('leads').select('*').order('fecha_creacion', { ascending: false });
      if (data) setLeads(data);
    };
    const fetchConfig = async () => {
      const { data } = await supabase.from('configuracion').select('*').single();
      if (data) setConfig(data);
    };
    fetchLeads();
    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchConversaciones = async () => {
      if (!selectedLead) return;
      const { data } = await supabase
        .from('conversaciones')
        .select('*')
        .eq('lead_id', selectedLead.id)
        .order('timestamp_in', { ascending: true });
      if (data) setConversaciones(data);
    };
    fetchConversaciones();
  }, [selectedLead]);

  const getCountdown = (inTime: string) => {
    if (!config) return '';
    const entrada = new Date(inTime).getTime();
    const previsto = entrada + config.segundos_rpta_ia * 1000;
    const ahora = Date.now();
    const diff = Math.floor((previsto - ahora) / 1000);
    return diff > 0 ? `⏳ Se enviará en ${diff}s` : '';
  };

  const getChannelIcon = (canal: string | undefined) => {
    if (!canal) return null;
    if (canal.toLowerCase() === 'whatsapp') return '📱';
    if (canal.toLowerCase() === 'instagram') return '📸';
    return '🌐';
  };

  const getColorClass = (tipo: string | undefined) => {
    if (tipo === 'A') return 'bg-green-600';
    if (tipo === 'B') return 'bg-yellow-500';
    if (tipo === 'C') return 'bg-red-600';
    return 'bg-gray-700';
  };

  return (
    <div className="grid grid-cols-12 gap-6 px-6 py-8 bg-gray-950 min-h-screen text-white font-sans">
      {/* Sidebar - Leads */}
      <div className="col-span-3">
        <Tabs defaultValue="kanban">
          <div className="flex gap-2 mb-4">
            <div className="w-full justify-between bg-gray-800 p-1 rounded-xl flex">
              <TabsTrigger value="kanban" className="w-full">Kanban</TabsTrigger>
              <TabsTrigger value="dashboard" className="w-full">Dashboard</TabsTrigger>
            </div>
          </div>
          <TabsContent value="kanban">
            {leads.map((lead) => (
              <Card
                key={lead.id}
                onClick={() => {
                  setSelectedLead(lead);
                  setIsEditing(false);
                }}
                className="cursor-pointer hover:bg-gray-800 mb-2 transition-colors duration-150 border border-gray-700 rounded-xl shadow-sm"
              >
                <div className="p-4">
                  <p className="font-semibold text-base flex items-center gap-2">
                    {getChannelIcon(lead.canal)} {lead.nombre || 'Sin nombre'}
                  </p>
                  <p className="text-sm text-gray-400">{lead.estado || 'Nuevo'}</p>
                </div>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="dashboard">
            <Card className="bg-gray-900 border border-gray-700 rounded-xl">
              <div className="p-6">
                <p className="text-gray-400">📊 Métricas del CRM (Próximamente)</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detalle Lead */}
      <div className="col-span-9">
        {selectedLead && !isEditing ? (
          <Card className="bg-gray-900 border border-gray-700 rounded-xl shadow-md">
            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold">{selectedLead.nombre || 'Lead seleccionado'}</h2>
              <p>📱 <strong>Canal:</strong> {selectedLead.canal}</p>
              <p>📞 <strong>Teléfono:</strong> {selectedLead.telefono}</p>
              <p>🏢 <strong>Industria:</strong> {selectedLead.industria || 'No especificada'}</p>
              <p>🧠 <strong>Personalidad:</strong> {selectedLead.personalidad || 'Sin definir'}</p>
              <p>💸 <strong>Facturación:</strong> {selectedLead.facturacion || 'No especificada'}</p>
              <p>👥 <strong>Tamaño del Negocio:</strong> {selectedLead.tamaño_negocio || 'No especificado'}</p>
              <p>🔥 <strong>Dolor Principal:</strong> {selectedLead.dolor_principal || 'No especificado'}</p>
              <p>📍 <strong>Origen:</strong> {selectedLead.origen || 'Sin origen'}</p>
              <p>🧾 <strong>Notas:</strong> {selectedLead.notas || 'Sin notas'}</p>
              <p>🧩 <strong>Tipo Cliente:</strong> <span className={`px-2 py-1 rounded ${getColorClass(selectedLead?.tipo_cliente)}`}>{selectedLead.tipo_cliente || 'No asignado'}</span></p>
              <p>📌 <strong>Estado:</strong> {selectedLead.estado || 'Sin estado'}</p>

              <hr className="border-gray-700 my-4" />

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">💬 Conversación</h3>
                {conversaciones.map((msg, i) => (
                  <div key={i} className="bg-gray-800 p-2 rounded-lg text-sm space-y-1">
                    <p><strong>Cliente:</strong> {msg.mensaje_in}</p>
                    {msg.mensaje_out && (
                      <p className="text-green-400">
                        <strong>Bot:</strong> {msg.mensaje_out}
                        <span className="ml-2 text-xs text-gray-400">{getCountdown(msg.timestamp_in)}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-500 text-white">Editar Lead</Button>
            </div>
          </Card>
        ) : selectedLead && isEditing ? (
          <Card className="bg-gray-900 border border-gray-700 rounded-xl shadow-md">
            <div className="p-6 space-y-4">
              {[
                'nombre', 'telefono', 'industria', 'personalidad', 'facturacion', 'tamaño_negocio',
                'dolor_principal', 'origen', 'estado', 'notas'
              ].map((field) => (
                <input
                  key={field}
                  type="text"
                  defaultValue={(selectedLead as any)[field] || ''}
                  placeholder={field.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
                  className="w-full p-2 rounded bg-gray-800 text-white"
                />
              ))}
              <div className="flex gap-2">
                {['A', 'B', 'C'].map((tipo) => (
                  <button
                    key={tipo}
                    className={`px-3 py-1 rounded ${getColorClass(tipo)} ${selectedLead.tipo_cliente === tipo ? 'ring-2 ring-white' : ''}`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
              <Button onClick={() => setIsEditing(false)} className="bg-green-600 hover:bg-green-500">Guardar</Button>
              <Button className="bg-transparent text-white hover:bg-gray-700" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="bg-gray-900 border border-gray-700 rounded-xl shadow-md">
            <div className="p-6 text-gray-400 text-center">
              <p className="text-lg">👈 Seleccioná un lead desde la izquierda para ver detalles.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
