using Bogus;

namespace BuddyApp.Api.Tests;

// The test-data builder (QLT-4): invented data from Bogus with a fixed seed, so every run gives the same data
// and no real person's data reaches the tests. A test that needs data asks for it here; a new kind of data gets
// its own method with the same seed.
public static class SampleData
{
    public const int Seed = 20261126;

    public static IReadOnlyList<SamplePerson> People(int count, int seed = Seed) =>
        new Faker<SamplePerson>("en")
            .UseSeed(seed)
            .CustomInstantiator(f =>
            {
                var first = f.Name.FirstName();
                var last = f.Name.LastName();
                return new SamplePerson($"{first} {last}", f.Internet.Email(first, last, "example.com"));
            })
            .Generate(count);
}

public sealed record SamplePerson(string Name, string Email);
