using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace GestionConvocatorias.Identity.Api.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        // Use a dummy PostgreSQL connection string for design-time migrations generation.
        // Actual connection is resolved at runtime in Program.cs.
        optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=GestionConvocatoriasDB;Username=postgres;Password=dummy");
        return new AppDbContext(optionsBuilder.Options);
    }
}
