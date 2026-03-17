import React, { forwardRef } from 'react';
import { PermutaData } from '../types';

interface PdfDocumentProps {
  data: PermutaData;
}

export const PdfDocument = forwardRef<HTMLDivElement, PdfDocumentProps>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-white p-12 text-black w-[800px] mx-auto font-serif"
        style={{ minHeight: '1131px', position: 'absolute', top: '-10000px', left: '-10000px' }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-6 mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">
            Serviço de Atendimento Móvel de Urgência
          </h1>
          <h2 className="text-xl font-bold text-red-600 tracking-widest">SAMU 192</h2>
          <p className="text-sm mt-2 text-gray-600">
            Coordenação Geral de Urgência e Emergência
          </p>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h3 className="text-xl font-bold underline uppercase">
            Requerimento de Permuta de Plantão
          </h3>
        </div>

        {/* Body */}
        <div className="text-justify leading-relaxed mb-10 space-y-6">
          <p className="indent-8 text-lg">
            Eu, <strong>{data.solicitanteNome || '_________________________'}</strong>, 
            matrícula nº <strong>{data.solicitanteMatricula || '_________'}</strong>, 
            ocupante do cargo de <strong>{data.solicitanteCargo || '_________'}</strong>, 
            lotado(a) na base <strong>{data.solicitanteBase || '_________'}</strong>, 
            venho respeitosamente requerer a V. Sa. autorização para permuta de plantão 
            com o(a) servidor(a) <strong>{data.substitutoNome || '_________________________'}</strong>, 
            matrícula nº <strong>{data.substitutoMatricula || '_________'}</strong>, 
            ocupante do cargo de <strong>{data.substitutoCargo || '_________'}</strong>, 
            lotado(a) na base <strong>{data.substitutoBase || '_________'}</strong>.
          </p>

          <div className="pl-8 border-l-4 border-gray-300 py-2 my-6 bg-gray-50">
            <p className="mb-2"><strong>Plantão Original (Solicitante):</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Data: {data.plantaoOriginalData}</li>
              <li>Horário: {data.plantaoOriginalHorario}</li>
            </ul>
            
            <p className="mt-4 mb-2"><strong>Plantão de Devolução (Substituto):</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Data: {data.plantaoDevolucaoData || 'N/A'}</li>
              <li>Horário: {data.plantaoDevolucaoHorario || 'N/A'}</li>
            </ul>
          </div>

          <p className="indent-8 text-lg">
            <strong>Justificativa:</strong> {data.justificativa || '____________________________________________________________________________________________________'}
          </p>
          
          <p className="indent-8 text-lg mt-6">
            Declaramos estar cientes de que a presente permuta não acarretará ônus para a Administração Pública 
            e que a responsabilidade pelo cumprimento do plantão passa a ser do servidor substituto após a 
            aprovação da Coordenação.
          </p>
        </div>

        {/* Date */}
        <div className="text-right mb-16 text-lg">
          <p>_____________________, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.</p>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 mt-12">
          {/* Solicitante Signature */}
          <div className="text-center flex flex-col items-center">
            {data.assinaturaSolicitante ? (
              <div className="border border-blue-800 rounded p-2 mb-2 w-full text-left text-xs bg-blue-50/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-800 text-white px-2 py-0.5 text-[10px] font-bold rounded-bl">
                  gov.br
                </div>
                <p className="font-bold text-blue-900 mt-2">Assinatura Eletrônica</p>
                <p className="text-gray-700 mt-1"><strong>Nome:</strong> {data.solicitanteNome}</p>
                <p className="text-gray-700"><strong>CPF:</strong> ***.{data.assinaturaSolicitante.cpf.substring(4, 7)}.{data.assinaturaSolicitante.cpf.substring(8, 11)}-**</p>
                <p className="text-gray-700"><strong>Data:</strong> {data.assinaturaSolicitante.timestamp}</p>
              </div>
            ) : (
              <div className="w-full border-b border-black mb-2 h-16"></div>
            )}
            <p className="font-bold">{data.solicitanteNome || 'Assinatura do Solicitante'}</p>
            <p className="text-sm text-gray-600">Matrícula: {data.solicitanteMatricula}</p>
          </div>

          {/* Substituto Signature */}
          <div className="text-center flex flex-col items-center">
            {data.assinaturaSubstituto ? (
              <div className="border border-blue-800 rounded p-2 mb-2 w-full text-left text-xs bg-blue-50/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-800 text-white px-2 py-0.5 text-[10px] font-bold rounded-bl">
                  gov.br
                </div>
                <p className="font-bold text-blue-900 mt-2">Assinatura Eletrônica</p>
                <p className="text-gray-700 mt-1"><strong>Nome:</strong> {data.substitutoNome}</p>
                <p className="text-gray-700"><strong>CPF:</strong> ***.{data.assinaturaSubstituto.cpf.substring(4, 7)}.{data.assinaturaSubstituto.cpf.substring(8, 11)}-**</p>
                <p className="text-gray-700"><strong>Data:</strong> {data.assinaturaSubstituto.timestamp}</p>
              </div>
            ) : (
              <div className="w-full border-b border-black mb-2 h-16"></div>
            )}
            <p className="font-bold">{data.substitutoNome || 'Assinatura do Substituto'}</p>
            <p className="text-sm text-gray-600">Matrícula: {data.substitutoMatricula}</p>
          </div>
        </div>

        {/* Coordenacao Signature */}
        <div className="mt-24 text-center flex flex-col items-center w-1/2 mx-auto">
          {data.assinaturaCoordenacao ? (
              <div className="border border-blue-800 rounded p-2 mb-2 w-full text-left text-xs bg-blue-50/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-800 text-white px-2 py-0.5 text-[10px] font-bold rounded-bl">
                  gov.br
                </div>
                <p className="font-bold text-blue-900 mt-2">Assinatura Eletrônica - DEFERIDO</p>
                <p className="text-gray-700 mt-1"><strong>Coordenação SAMU 192</strong></p>
                <p className="text-gray-700"><strong>CPF:</strong> ***.{data.assinaturaCoordenacao.cpf.substring(4, 7)}.{data.assinaturaCoordenacao.cpf.substring(8, 11)}-**</p>
                <p className="text-gray-700"><strong>Data:</strong> {data.assinaturaCoordenacao.timestamp}</p>
              </div>
            ) : (
              <div className="w-full border-b border-black mb-2 h-16"></div>
            )}
          <p className="font-bold">Coordenação SAMU 192</p>
          <p className="text-sm text-gray-600">Autorização / Deferimento</p>
        </div>
        
        {/* Footer */}
        <div className="mt-16 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>Documento gerado eletronicamente pelo Sistema de Permutas SAMU 192.</p>
          {(data.assinaturaSolicitante || data.assinaturaSubstituto || data.assinaturaCoordenacao) && <p>Autenticidade verificável através do portal gov.br.</p>}
        </div>
      </div>
    );
  }
);

PdfDocument.displayName = 'PdfDocument';

