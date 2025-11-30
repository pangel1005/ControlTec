namespace ControlTec.Models
{
    public static class EstadosSolicitud
    {
        public const string Pendiente = "Pendiente";
        public const string Depositada = "Depositada";
        public const string ValidacionRecepcion = "Validación Recepción";
        public const string EvaluacionTecnica = "Evaluación Técnica";
        public const string AprobacionDIGEAMPS = "Aprobación DIGEAMPS";
        public const string AprobacionDNCD = "Aprobación DNCD";
        public const string Devuelta = "Devuelta";          // 👈 NUEVO
        public const string Aprobada = "Aprobada";
        public const string Rechazada = "Rechazada";
        public const string Entregada = "Entregada";
    }
}
