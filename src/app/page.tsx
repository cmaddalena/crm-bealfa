// CRM UI con Kanban y Vista tipo WhatsApp con Timer de IA y gestión de conversación

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card } from './components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Button } from './components/ui/button';

interface Lead {
  id: string;
  nombre?: string;
  canal?: string;
  telefono?: string;
  usuario_instagram?: string;
  industria?: string;
  estado?: string;
  personalidad?: string;
  facturacion?: string;
  tamaño_negocio?: string;
  dolor_principal?: string;
  origen?: string;
  referido_id?: string;
  notas?: string;
  tipo_cliente?: 'A' | 'B' | 'C';
  tomar_conversacion?: boolean;
}

interface Conversacion {
  id: string;
  lead_id: string;
  mensaje: string;
  mensaje_out?: string;
  timestamp: string;
  timestamp_out?: string;
  tipo: 'entrada' | 'salida';
  autor: 'bot' | 'humano';
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CRMApp() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [segundosIA, setSegundosIA] = useState<number>(600); // por defecto 10 minutos

  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase.from('leads').select('*');
      if (!error && data) setLeads(data as Lead[]);
    };

    const fetchConfig = async () => {
      const { data } = await supabase.from('configuracion').select('segundos_rpta_ia').single();
      if (data?.segundos_rpta_ia) setSegundosIA(data.segundos_rpta_ia);
    };

    fetchLeads();
    fetchConfig();
  }, []);

  const abrirConversacion = async (lead: Lead) => {
    setSelectedLead(lead);
    setModalAbierto(true);
    const { data } = await supabase
      .from('conversaciones')
      .select('*')
      .eq('lead_id', lead.id)
      .order('timestamp', { ascending: true });
    if (data) setConversaciones(data as Conversacion[]);
  };

  const handleTomarConversacion = async () => {
    if (!selectedLead) return;
    const { error } = await supabase
      .from('leads')
      .update({ tomar_conversacion: true })
      .eq('id', selectedLead.id);
    if (!error) {
      setSelectedLead({ ...selectedLead, tomar_conversacion: true });
    }
  };

  const getCountdown = (timestampIn: string) => {
    const entrada = new Date(timestampIn).getTime();
    const salidaEstimada = entrada + segundosIA * 1000;
    const diff = salidaEstimada - new Date().getTime();
    const minutos = Math.floor(diff / 60000);
    const segundos = Math.floor((diff % 60000) / 1000);
    return diff > 0 ? `${minutos}m ${segundos}s` : 'Listo para enviar';
  };

  const groupedLeads = leads.reduce((acc: Record<string, Lead[]>, lead) => {
    const estado = lead.estado || 'Sin estado';
    if (!acc[estado]) acc[estado] = [];
    acc[estado].push(lead);
    return acc;
  }, {});

  return (
    <div className="bg-gray-950 text-white p-6 min-h-screen">
      {!modalAbierto ? (
        <div className="grid grid-cols-4 gap-6">
          {Object.entries(groupedLeads).map(([estado, leadsEstado]) => (
            <div key={estado} className="bg-gray-900 rounded-xl p-4 border border-gray-700">
              <h3 className="text-lg font-bold mb-4">{estado}</h3>
              {leadsEstado.map((lead) => (
                <Card
                  key={lead.id}
                  onClick={() => abrirConversacion(lead)}
                  className="p-4 mb-2 hover:bg-gray-800 cursor-pointer"
                >
                  <p className="font-semibold">{lead.nombre || 'Sin nombre'}</p>
                  <p className="text-sm text-gray-400">{lead.canal}</p>
                </Card>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Datos lead */}
          <div className="col-span-4 bg-gray-900 p-4 rounded-xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedLead?.nombre || 'Lead'}</h2>
              <button onClick={() => setModalAbierto(false)}>❌</button>
            </div>
            <p><strong>Canal:</strong> {selectedLead?.canal}</p>
            <p><strong>Teléfono:</strong> {selectedLead?.telefono}</p>
            <p><strong>Industria:</strong> {selectedLead?.industria}</p>
            <p><strong>Dolor:</strong> {selectedLead?.dolor_principal}</p>
            <p><strong>Facturación:</strong> {selectedLead?.facturacion}</p>
            <p><strong>Notas:</strong> {selectedLead?.notas}</p>
            {!selectedLead?.tomar_conversacion && (
              <Button onClick={handleTomarConversacion} className="mt-4">Tomar conversación</Button>
            )}
          </div>

          {/* Conversación */}
          <div className="col-span-8 bg-gray-900 p-4 rounded-xl border border-gray-700 h-[80vh] overflow-y-scroll">
            {conversaciones.map((msg) => (
              <div key={msg.id} className={`mb-3 ${msg.tipo === 'salida' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block px-4 py-2 rounded-xl ${msg.tipo === 'salida' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                  <p>{msg.mensaje}</p>
                  {msg.tipo === 'salida' && !selectedLead?.tomar_conversacion && msg.timestamp_out && (
                    <p className="text-xs mt-1 text-gray-300">
                      Se enviará en: {getCountdown(msg.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
