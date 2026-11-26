using System.Text.RegularExpressions;
using ArchUnitNET.Domain;
using ArchUnitNET.Domain.Extensions;
using ArchUnitNET.Fluent.Conditions;
using ArchUnitNET.Loader;
using ArchUnitNET.xUnit;
using static ArchUnitNET.Fluent.ArchRuleDefinition;

namespace BuddyApp.Api.Tests;

// TST-3: the structural rules, read from the compiled code with ArchUnitNET. It cannot see Minimal API endpoints;
// EndpointSecurityTests starts the application for those.
public class ArchitectureTests
{
    // The application's own code. A project that splits it into more assemblies (a data layer, a domain) adds them here.
    // Types(true) below also reaches the types the code only references (Bogus, Entity Framework), which is what the rules name.
    private static readonly Architecture Application = new ArchLoader().LoadAssemblies(typeof(Program).Assembly).Build();

    [Fact]
    public void The_api_does_not_depend_on_the_tests_or_on_test_libraries()
    {
        Types().That().ResideInAssembly(typeof(Program).Assembly)
            .Should().NotDependOnAny(Types(true).That()
                .ResideInNamespaceOrBelow(typeof(SampleData).Namespace!)
                .Or().ResideInNamespaceOrBelow("Xunit")
                .Or().ResideInNamespaceOrBelow("Bogus")
                .Or().ResideInNamespaceOrBelow("Microsoft.AspNetCore.Mvc.Testing"))
            .Because("test code and invented test data must never ship in the application")
            .Check(Application);
    }

    [Fact]
    public void Migrations_change_structure_and_never_load_data__nothing_to_check_until_the_project_has_migrations()
    {
        // The template has no Entity Framework yet, so no class derives from Migration and the rule passes with
        // nothing checked. Once migrations exist, every one of them is checked. Sql is refused too: the rule cannot
        // tell structure from data in raw SQL, so a migration that needs it departs from TST-3 with an ADR.
        Classes().That().AreAssignableTo(Types(true).That().HaveFullName("Microsoft.EntityFrameworkCore.Migrations.Migration"))
            .Should().FollowCustomCondition(LoadsNoData, "call none of MigrationBuilder's InsertData, UpdateData, DeleteData or Sql")
            .Because("migrations change the structure and never load data; data is loaded by the application or a seed")
            .WithoutRequiringPositiveResults()
            .Check(Application);
    }

    private static readonly Regex DataLoading = new(@"^(InsertData|UpdateData|DeleteData|Sql)\(");

    // ArchUnitNET's NotCallAny sees only the application's own methods, not MigrationBuilder's, so the calls are read here.
    private static ConditionResult LoadsNoData(Class migration)
    {
        var calls = migration.Members
            .SelectMany(m => m.GetMethodCallDependencies())
            .Where(c => c.TargetMember.DeclaringType.FullName == "Microsoft.EntityFrameworkCore.Migrations.MigrationBuilder"
                && DataLoading.IsMatch(c.TargetMember.Name))
            .Select(c => c.TargetMember.Name[..c.TargetMember.Name.IndexOf('(')])
            .Distinct()
            .ToList();
        return new ConditionResult(migration, calls.Count == 0, $"loads data with {string.Join(", ", calls)}");
    }
}
