import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...\n');

    // ── Create Genres ──
    const genreNames = [
        'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
        'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery',
        'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western',
    ];

    const genres: Record<string, string> = {};
    for (const name of genreNames) {
        const genre = await prisma.genre.upsert({
            where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
            update: {},
            create: {
                name,
                slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            },
        });
        genres[name] = genre.id;
    }
    console.log(`✅ ${genreNames.length} genres created`);

    // ── Create Movies ──
    const movies = [
        { title: 'The Shawshank Redemption', year: 1994, genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/9cjIGRnKzFYsiIqEqpiRylCBuWs.jpg', desc: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.' },
        { title: 'The Godfather', year: 1972, genres: ['Crime', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', desc: 'The aging patriarch of an organized crime dynasty transfers control to his reluctant youngest son.' },
        { title: 'The Dark Knight', year: 2008, genres: ['Action', 'Crime', 'Drama', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911BTUgMe1nSGLq.jpg', desc: 'When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest tests.' },
        { title: 'Pulp Fiction', year: 1994, genres: ['Crime', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', desc: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.' },
        { title: 'Fight Club', year: 1999, genres: ['Drama', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', desc: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club.' },
        { title: 'Inception', year: 2010, genres: ['Action', 'Sci-Fi', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', desc: 'A thief who steals corporate secrets through dream-sharing technology is given the task of planting an idea into the mind of a CEO.' },
        { title: 'The Matrix', year: 1999, genres: ['Action', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', desc: 'A computer hacker learns about the true nature of reality and his role in the war against its controllers.' },
        { title: 'Goodfellas', year: 1990, genres: ['Crime', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJDx4OIF9BNQN6ua.jpg', desc: 'The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen and mob partners.' },
        { title: 'Interstellar', year: 2014, genres: ['Adventure', 'Drama', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', desc: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.' },
        { title: 'Parasite', year: 2019, genres: ['Comedy', 'Drama', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', desc: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the poor Kim family.' },
        { title: 'The Silence of the Lambs', year: 1991, genres: ['Crime', 'Drama', 'Horror', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/uS9m8OBk1RVfbPY0sIjmB4oE3ax.jpg', desc: 'A young FBI cadet must receive the help of an incarcerated and manipulative cannibal killer.' },
        { title: 'Forrest Gump', year: 1994, genres: ['Drama', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', desc: 'The presidencies of Kennedy and Johnson through the eyes of an Alabama man with an IQ of 75.' },
        { title: 'Spirited Away', year: 2001, genres: ['Animation', 'Adventure', 'Fantasy'], poster: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', desc: 'During her family\'s move, a young girl enters the world of spirits ruled by gods, witches, and spirits.' },
        { title: 'The Lord of the Rings: The Return of the King', year: 2003, genres: ['Action', 'Adventure', 'Fantasy'], poster: 'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', desc: 'Gandalf and Aragorn lead the World of Men against Sauron\'s army to draw his gaze from Frodo and Sam.' },
        { title: 'Whiplash', year: 2014, genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg', desc: 'A promising young drummer enrolls at a music conservatory where his dreams are mentored by an instructor who will stop at nothing.' },
        { title: 'Schindler\'s List', year: 1993, genres: ['Drama', 'War'], poster: 'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg', desc: 'In German-occupied Poland during World War II, Oskar Schindler gradually becomes concerned for his Jewish workforce.' },
        { title: 'The Prestige', year: 2006, genres: ['Drama', 'Mystery', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/tRNlZbgNCNOpLpbPEz5L8G8A0JN.jpg', desc: 'After a tragic accident, two stage magicians in 1890s London engage in a battle to create the ultimate illusion.' },
        { title: 'Blade Runner 2049', year: 2017, genres: ['Drama', 'Mystery', 'Sci-Fi', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', desc: 'Young Blade Runner K\'s discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard.' },
        { title: 'Mad Max: Fury Road', year: 2015, genres: ['Action', 'Adventure', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/8tZYtuWezp8JbcsvHYO0O46tFBO.jpg', desc: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler with the help of a group including Max.' },
        { title: 'No Country for Old Men', year: 2007, genres: ['Crime', 'Drama', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/bj1v6YKF8yHqA489GFiMqCKBqEx.jpg', desc: 'Violence and mayhem ensue after a hunter stumbles upon a drug deal gone wrong and more than two million dollars in cash.' },
        { title: 'Get Out', year: 2017, genres: ['Horror', 'Mystery', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg', desc: 'A young African-American visits his white girlfriend\'s parents for the weekend, where his simmering uneasiness escalates.' },
        { title: 'La La Land', year: 2016, genres: ['Comedy', 'Drama', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', desc: 'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations.' },
        { title: 'The Grand Budapest Hotel', year: 2014, genres: ['Adventure', 'Comedy', 'Crime'], poster: 'https://image.tmdb.org/t/p/w500/eWDyPq7Z3IBdgz0xR0K4XresTfg.jpg', desc: 'A writer encounters the owner of an aging high-class hotel, who tells him of his early years as a lobby boy.' },
        { title: 'Arrival', year: 2016, genres: ['Drama', 'Mystery', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg', desc: 'A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecrafts appear around the world.' },
        { title: 'The Social Network', year: 2010, genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/n0ybibhJtQ5icDqTp8eRytcIHJx.jpg', desc: 'As Harvard students create the social networking site that would become known as Facebook, they must deal with lawsuits and betrayal.' },
        { title: 'Moonlight', year: 2016, genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/4911T5FbJ9eD2Faz5Z8cT3SUhU3.jpg', desc: 'A young African-American man grapples with his identity and sexuality while experiencing the everyday struggles of childhood and adulthood.' },
        { title: 'Django Unchained', year: 2012, genres: ['Drama', 'Western'], poster: 'https://image.tmdb.org/t/p/w500/7oWY8VDWW7thTzWh3OKYRkWUlD5.jpg', desc: 'With the help of a German bounty-hunter, a freed slave sets out to rescue his wife from a brutal plantation owner.' },
        { title: 'The Departed', year: 2006, genres: ['Crime', 'Drama', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/nT97ifVT2J1yMQmeq20Dqv60GkE.jpg', desc: 'An undercover cop and a mole in the police attempt to identify each other while infiltrating an Irish gang in South Boston.' },
        { title: 'Everything Everywhere All at Once', year: 2022, genres: ['Action', 'Adventure', 'Comedy', 'Fantasy', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg', desc: 'A middle-aged Chinese immigrant is swept up into an insane adventure in which she alone can save existence by exploring other universes.' },
        { title: 'Dune', year: 2021, genres: ['Action', 'Adventure', 'Drama', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', desc: 'Paul Atreides must travel to the most dangerous planet in the universe to ensure the future of his family and his people.' },
        { title: 'Hereditary', year: 2018, genres: ['Drama', 'Horror', 'Mystery'], poster: 'https://image.tmdb.org/t/p/w500/p9fmuz2Oj3TtMGQ1VHGkGnRFz1R.jpg', desc: 'A grieving family is haunted by tragic and disturbing occurrences after the death of their secretive grandmother.' },
        { title: 'Oppenheimer', year: 2023, genres: ['Drama', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', desc: 'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.' },
        { title: 'The Truman Show', year: 1998, genres: ['Comedy', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/vuza0WqY239yBXOadKlGwJsZJFE.jpg', desc: 'An insurance salesman discovers his whole life is actually a reality TV show.' },
        { title: 'There Will Be Blood', year: 2007, genres: ['Drama'], poster: 'https://image.tmdb.org/t/p/w500/fa0RDkAlCec0STeMNAhPaF89q6U.jpg', desc: 'A story of family, religion, hatred, oil and madness, focusing on a turn-of-the-century prospector.' },
        { title: 'Eternal Sunshine of the Spotless Mind', year: 2004, genres: ['Drama', 'Romance', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/5MwkWH9tYHv3mV9OdYTMR5qreIz.jpg', desc: 'When their relationship turns sour, a couple undergoes a medical procedure to have each other erased from their memories.' },
        { title: 'Gladiator', year: 2000, genres: ['Action', 'Adventure', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgCMYS.jpg', desc: 'A Roman general is betrayed and reduced to slavery, forced to fight as a gladiator seeking revenge.' },
        { title: 'The Lighthouse', year: 2019, genres: ['Drama', 'Fantasy', 'Horror', 'Mystery'], poster: 'https://image.tmdb.org/t/p/w500/3nk9UoepMnmSvUGFUbOKYOVbuRB.jpg', desc: 'Two lighthouse keepers try to maintain their sanity while living on a remote and mysterious New England island.' },
        { title: 'Amélie', year: 2001, genres: ['Comedy', 'Romance'], poster: 'https://image.tmdb.org/t/p/w500/nSxDo4fBfaTB2OFN0WqjhPvm17M.jpg', desc: 'Amélie is an innocent girl in Paris with her own sense of justice, who decides to help those around her.' },
        { title: 'The Thing', year: 1982, genres: ['Horror', 'Mystery', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/tzGY49kseSE9QAKk47uuDGwnSCu.jpg', desc: 'A research team in Antarctica encounters an alien organism that assimilates and imitates other life forms.' },
        { title: 'Alien', year: 1979, genres: ['Horror', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg', desc: 'The crew of a commercial spacecraft encounter a deadly lifeform after investigating an unknown transmission.' },
        { title: 'Drive', year: 2011, genres: ['Crime', 'Drama', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/602vevIURmpDfzbnv5Ubi6wIkQm.jpg', desc: 'A mysterious Hollywood stuntman gets pulled into a criminal underworld after helping his neighbor.' },
        { title: 'The Batman', year: 2022, genres: ['Action', 'Crime', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg', desc: 'In his second year of fighting crime, Batman uncovers corruption in Gotham while pursuing the Riddler.' },
        { title: 'Prisoners', year: 2013, genres: ['Crime', 'Drama', 'Mystery', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/uhOssnCzPpQEoRHHbwOEzuGdspg.jpg', desc: 'When Keller Dover\'s daughter and her friend go missing, he takes matters into his own hands.' },
        { title: 'Midsommar', year: 2019, genres: ['Drama', 'Horror', 'Mystery'], poster: 'https://image.tmdb.org/t/p/w500/7LEI8ulZEDFOSvJJrOSxkpHMpR8.jpg', desc: 'A couple travels to Sweden to visit a rural town\'s fabled mid-summer festival, but what begins as an idyllic retreat quickly turns sinister.' },
        { title: 'The Revenant', year: 2015, genres: ['Action', 'Adventure', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/ji3ecJphATlVgWNY0B4ggeIi43y.jpg', desc: 'A frontiersman on a fur trading expedition fights for survival after being mauled by a bear and left for dead.' },
        { title: 'Gone Girl', year: 2014, genres: ['Drama', 'Mystery', 'Thriller'], poster: 'https://image.tmdb.org/t/p/w500/lv5xShBIDPe7m4J8i9VEO8cVvwj.jpg', desc: 'With his wife\'s disappearance, Nick Dunne finds himself the prime suspect and media circus target.' },
        { title: 'Inside Out', year: 2015, genres: ['Animation', 'Adventure', 'Comedy', 'Drama', 'Fantasy'], poster: 'https://image.tmdb.org/t/p/w500/2H1TmgdfNtsKlU9osGFOgqbo0hV.jpg', desc: 'After young Riley is uprooted from her Midwest life, her emotions conflict on how best to navigate a new city and school.' },
        { title: 'Birdman', year: 2014, genres: ['Comedy', 'Drama'], poster: 'https://image.tmdb.org/t/p/w500/rSGr0EEEi5Pnq5pkTrqbJdPS1YC.jpg', desc: 'A washed-up superhero actor attempts to revive his fading career by writing and starring in a Broadway production.' },
        { title: 'Her', year: 2013, genres: ['Drama', 'Romance', 'Sci-Fi'], poster: 'https://image.tmdb.org/t/p/w500/yk4J4aewWYNiBhD49WP6PfVCZwc.jpg', desc: 'A lonely writer develops an unlikely relationship with an operating system designed to meet his every need.' },
        { title: 'Jojo Rabbit', year: 2019, genres: ['Comedy', 'Drama', 'War'], poster: 'https://image.tmdb.org/t/p/w500/7GsM4mtM0worKGi5v6JkaltMBbG.jpg', desc: 'A young German boy discovers that his single mother is hiding a Jewish girl in their attic.' },
    ];

    for (const m of movies) {
        const movie = await prisma.movie.upsert({
            where: {
                id: m.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30),
            },
            update: {},
            create: {
                title: m.title,
                year: m.year,
                posterUrl: m.poster,
                description: m.desc,
            },
        });

        // Connect genres
        for (const genreName of m.genres) {
            const genreId = genres[genreName];
            if (genreId) {
                await prisma.movieGenre.upsert({
                    where: { movieId_genreId: { movieId: movie.id, genreId } },
                    update: {},
                    create: { movieId: movie.id, genreId },
                });
            }
        }
    }

    console.log(`✅ ${movies.length} movies seeded`);
    console.log('\n🎉 Seed complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
