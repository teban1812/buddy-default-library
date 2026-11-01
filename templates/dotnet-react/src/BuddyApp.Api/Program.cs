var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.Run();

// Lets the tests start the app through WebApplicationFactory<Program>.
public partial class Program;
