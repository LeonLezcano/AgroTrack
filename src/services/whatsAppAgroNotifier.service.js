/**
 * AgroTrack - WhatsApp E.164 Field Notification Engine
 * Engine #108 & #157 (Producer & Machine Operator Communication)
 */

export class WhatsAppAgroNotifier {
  static cleanPhoneNumber(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '549' + cleaned.slice(1);
    } else if (cleaned.startsWith('+549')) {
      cleaned = cleaned.slice(1);
    } else if (cleaned.startsWith('+')) {
      cleaned = cleaned.slice(1);
    }
    if (!cleaned.startsWith('549') && cleaned.length === 10) {
      cleaned = '549' + cleaned;
    }
    return cleaned;
  }

  static generateWorkOrderCertificateUrl({
    producerPhone,
    producerName,
    orderId,
    lotName,
    establishmentName,
    laborType,
    hectaresApplied,
    machineName,
    hashSeal
  }) {
    const cleanPhone = this.cleanPhoneNumber(producerPhone);
    const text =
      `🚜 *AgroTrack - Acta Digital de Labor Certificada*\n\n` +
      `Estimado/a *${producerName || 'Productor'}*:\n` +
      `Se ha finalizado la labor de *${laborType}* en *${establishmentName}* - Lote *${lotName}*.\n\n` +
      `📋 *Detalle del Trabajo:*\n` +
      `• Orden N°: ${orderId}\n` +
      `• Superficie Aplicada: *${hectaresApplied} ha*\n` +
      `• Maquinaria: ${machineName}\n` +
      `• Sello de Integridad SHA-256: ${hashSeal ? hashSeal.slice(0, 16) + '...' : 'Auditado'}\n\n` +
      `_La labor cuenta con doble firma digital ePOD y condiciones meteorológicas auditadas._`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  static generateWeatherAlertUrl({
    producerPhone,
    producerName,
    lotName,
    deltaT,
    windSpeedKmH,
    reason
  }) {
    const cleanPhone = this.cleanPhoneNumber(producerPhone);
    const text =
      `⚠️ *ALERTA METEOROLÓGICA DE PULVERIZACIÓN - AGROTRACK*\n\n` +
      `Atención *${producerName}*:\n` +
      `En el lote *${lotName}* se han detectado condiciones desfavorables para la aplicación fitosanitaria:\n\n` +
      `• Delta T: *${deltaT}°C*\n` +
      `• Velocidad de Viento: *${windSpeedKmH} km/h*\n` +
      `• Situación: ${reason}\n\n` +
      `🛑 *Recomendación:* Suspender labor para prevenir pérdidas por deriva o evaporación.\n` +
      `_Trazabilidad Responsable AgroTrack._`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }
}
