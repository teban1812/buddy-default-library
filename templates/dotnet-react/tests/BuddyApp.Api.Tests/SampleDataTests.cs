namespace BuddyApp.Api.Tests;

// QLT-4: test data is invented and generated with a fixed seed, so every run gives the same data.
public class SampleDataTests
{
    [Fact]
    public void The_same_seed_gives_the_same_people_on_every_run()
    {
        var first = SampleData.People(3);
        var second = SampleData.People(3);

        Assert.Equal(first, second);
        Assert.Equal(3, first.Count);
    }

    [Fact]
    public void The_seed_gives_the_people_written_here_on_every_run()
    {
        // Written from the first run: a later run, on any machine, must give the same first person.
        Assert.Equal(new SamplePerson("Roosevelt Jacobi", "Roosevelt_Jacobi@example.com"), SampleData.People(1)[0]);
    }

    [Fact]
    public void A_different_seed_gives_different_people()
    {
        Assert.NotEqual(SampleData.People(3), SampleData.People(3, seed: SampleData.Seed + 1));
    }

    [Fact]
    public void The_people_are_invented_with_emails_on_a_reserved_domain()
    {
        foreach (var person in SampleData.People(5))
        {
            Assert.False(string.IsNullOrWhiteSpace(person.Name));
            Assert.EndsWith("@example.com", person.Email);
        }
    }
}
