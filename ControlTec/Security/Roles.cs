namespace ControlTec.Security
{
    public static class Roles
    {
        public const string Solicitante = "Solicitante";
        public const string VUS = "VUS";
        public const string TecnicoUPC = "TecnicoUPC";
        public const string EncargadoUPC = "EncargadoUPC";
        public const string Direccion = "Direccion";
        public const string DNCD = "DNCD";
        public const string Admin = "Admin";

        // Combinaciones útiles de roles
        public const string TodosBackoffice =
            VUS + "," + TecnicoUPC + "," + EncargadoUPC + "," + Direccion + "," + DNCD + "," + Admin;
    }
}
