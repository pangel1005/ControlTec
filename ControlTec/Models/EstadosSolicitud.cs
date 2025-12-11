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
        public const string EnRevisionVUS = "En Revisión VUS";
        public const string Devuelta = "Devuelta";
        public const string RechazadaET = "RechazadaET";
        public const string Aprobada = "Aprobada";
        public const string Rechazada = "Rechazada";
        public const string Entregada = "Entregada";
        // NUEVOS ESTADOS PARA FASES
        public const string PendienteFase1 = "PendienteFase1";
        public const string DepositadaFase1 = "DepositadaFase1";
        public const string Fase1Aprobada = "Fase1Aprobada";
        public const string PendienteFase2 = "PendienteFase2";
        public const string DepositadaFase2 = "DepositadaFase2";
        public const string Fase2Aprobada = "Fase2Aprobada";
    }
}