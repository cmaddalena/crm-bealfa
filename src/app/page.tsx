// Estructura base del CRM UI con integración de Chatwoot y conexión a Supabase

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
  industria?: string;
  estado?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CRMApp() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('fecha_creacion', { ascending: false });
      if (!error && data) setLeads(data as Lead[]);
    };
    fetchLeads();
  }, []);

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
            {leads.map((lead: Lead) => (
              <Card
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="cursor-pointer hover:bg-gray-800 mb-2 transition-colors duration-150 border border-gray-700 rounded-xl shadow-sm"
              >
                <div className="p-4">
                  <p className="font-semibold text-base">{lead.nombre || 'Sin nombre'}</p>
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
      <div className="col-span-6">
        {selectedLead ? (
          <Card className="bg-gray-900 border border-gray-700 rounded-xl shadow-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">{selectedLead?.nombre || 'Lead seleccionado'}</h2>
              <p className="mb-2">📱 <strong>Canal:</strong> {selectedLead?.canal}</p>
              <p className="mb-2">📞 <strong>Teléfono:</strong> {selectedLead?.telefono}</p>
              <p className="mb-2">🏢 <strong>Industria:</strong> {selectedLead?.industria || 'No especificada'}</p>
              <p className="mb-6">📌 <strong>Estado:</strong> {selectedLead?.estado || 'Sin estado'}</p>
              <Button className="bg-blue-600 hover:bg-blue-500 text-white">Editar Lead</Button>
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

      {/* Chatwoot embebido */}
      <div className="col-span-3">
        <Card className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
          <div className="p-0">
            <iframe
              src="https://tu-chatwoot.com/app/accounts/1/inbox"
              width="100%"
              height="600px"
              frameBorder="0"
              className="rounded-b-xl w-full"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
