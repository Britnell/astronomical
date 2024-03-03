type Movies = {
  overview: string;
  backdrop_path: string;
  poster_path: string;
  title: string;
  popularity: number;
  vote_average: number;
};

export default function Grids({ data }: { data: Movies[] }) {
  return (
    <div>
      <h1>Hey-ho! welcome to grid camp</h1>

      <section>
        <h2>1fr</h2>
        <p>3 growing cols `1fr` each, EASY</p>
        <div className="grid gap-4 grid-cols-[repeat(3,1fr)] ">
          <Squares n={3} />
        </div>
      </section>

      <section>
        <h2>1fr</h2>
        <p>
          {`BUT this can be messed up in some cases in the real world, depending on the cards' content and it's size, as 1fr only determines the growth of available area`}
        </p>
        <div className="grid gap-4 grid-cols-[repeat(3,1fr)]  overflow-auto">
          <>
            {data.slice(0, 3).map((_mov, m) => {
              const mov = { ..._mov };
              if (m !== 2) mov.overview = "...";
              return (
                <div className=" bg-gray-200 ">
                  <MovieImg path={mov.poster_path} className=" " />
                  <h3 className=" font-serif text-4xl font-bold">
                    {mov.title}
                  </h3>
                  <p className=" whitespace-pre ">{mov.overview}</p>
                </div>
              );
            })}
          </>
          {/* <MovieCards
            data={data.slice(2, 4).map((mv) => {
              const cp = { ...mv };
              cp.overview = "...";
              return cp;
            })}
          />
          <MovieCards data={data} n={1} /> */}
        </div>
      </section>

      <section>
        <h2>3 cols</h2>
        <p>
          to actually get 3 cols with content we can use{" "}
          <code>repeat(3,minmax(0,1fr))</code> - thats what tailwind does!
        </p>
        <div className="grid gap-4 grid-cols-[repeat(3,minmax(0,1fr))]  ">
          <MovieCards data={data} n={3} />
        </div>
      </section>

      <section>
        <h2>{`...minmax(100px,300px) ?`}</h2>
        <p>{`cols will take the max (available space) it can. e.g. 300px. only <300px do these cols shrink down until they hit 100px, and then the grid overflows `}</p>
        <div className="grid gap-4 grid-cols-[repeat(3,minmax(100px,300px))] justify-center  ">
          <MovieCards data={data} n={3} />
        </div>
      </section>

      <section>
        <h2>{` sweet, can we do that automagically? `}</h2>
        <p>{` yes, it will automatically fill the grid with collumns of specified size (also adding empty columns)  `}</p>
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] justify-center ">
          <MovieCards data={data} n={3} />
        </div>
      </section>

      <section>
        <h2>{` and auto-fit? `}</h2>
        <p>{`generally for grid with many elements this behaves the same. but when there is leftover space, then content wins. 
        existing content is 'fit' into grid when it can, so when it's just 3 then they grow. this is more niche, generally go with auto-fill as default `}</p>
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))] justify-center ">
          <MovieCards data={data} n={3} />
        </div>
      </section>

      <section>
        <h2>so for a grid of many items?</h2>
        <code>`repeat(auto-fill,minmax(140px,1fr))`</code>
        <p>{` will fit in as many cols of min-width as it can. the rest space is grown into with 1fr  `}</p>
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(140px,1fr))] justify-center ">
          <MovieCards data={data} n={10} />
        </div>
      </section>

      <section>
        <h2>with a max size</h2>
        <code>`repeat(auto-fill,minmax(400px,450px))`</code>
        <p>{` minmax(...,500px) will generally fit as many cols of 500px as it can, without growing larger than that.`}</p>
        <p>{` the min value only comes into play when the grid has less than the max space available, now elements start shrinking and the min tells us when to stop shrinking. having a min of 400px though would create overflow on mobile, so we can just use 0 to shrink cols to all sizes. (unless we want a scrollable carousel) `}</p>
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(0,450px))] justify-center ">
          <MovieCards data={data} n={4} />
        </div>
      </section>

      <section>
        <h2>fit-content</h2>
        <p>{` this will grow up to a max of the value provided, and shrink down ao a min of 'min-content' . but im not sure if this same behaviour couldnt be achieved with a min. `}</p>
        <div className="grid gap-4 grid-cols-[fit-content(300px)_1fr] ">
          <p className="x">{data[0].overview}</p>
          <div>
            <MovieCards data={data} n={1} />
          </div>
        </div>
      </section>

      <section>
        <h2>grid for page-layout w breakouts</h2>
        <p>
          {` this is as per the almighty `}
          <a href="https://www.youtube.com/watch?v=c13gpBrnGEw">Kevin Powell</a>
          {` using css grid to layout the pages main content. using col names we can define different line width, so it is easy to breakout content that is wider than the page. simple example to understand whats going on. `}
        </p>
        <div className="grid-kevin-simple   ">
          <>
            {data.slice(0, 2).map((mov) => (
              <>
                <MovieImg
                  path={mov.poster_path}
                  className={" w-full aspect-[3] object-cover screenwidth"}
                />
                <h3>{mov.title}</h3>
                <p>{mov.overview}</p>
              </>
            ))}
          </>
        </div>
      </section>

      <section>
        <h2>"The Kevin Grid"</h2>
        <p>
          This is
          <a href="https://www.youtube.com/watch?v=c13gpBrnGEw">
            Kevin Powell's full fancy content grid formula{" "}
          </a>
        </p>
        <div className="content-grid   ">
          <>
            {data.slice(0, 2).map((mov, m) => (
              <>
                <MovieImg
                  path={mov.poster_path}
                  className={
                    " w-full aspect-[3] object-cover " +
                    (m === 0 ? " breakout" : " ")
                  }
                />
                <h3>{mov.title}</h3>
                <p>{mov.overview}</p>
                {m === 0 && (
                  <div className="full-width bg-blue-500 font-serif text-7xl  text-white">
                    <p>SUPER HIGHLIGHT QUOTE</p>
                  </div>
                )}
              </>
            ))}
          </>
        </div>
      </section>
    </div>
  );
}

const MovieImg = (props: { path: string; className?: string }) => (
  <img
    src={`https://image.tmdb.org/t/p/w300/${props.path}`}
    alt="movie post"
    className={props.className}
  />
);

const MovieCards = ({ data, n = 20 }: { data: Movies[]; n?: number }) => (
  <>
    {data.slice(0, n).map((mov) => (
      <div className=" bg-gray-200 ">
        <MovieImg
          path={mov.poster_path}
          className=" w-full aspect-video object-cover "
        />
        <h3 className=" font-serif text-4xl font-bold">{mov.title}</h3>
        <p className=" ">{mov.overview}</p>
      </div>
    ))}
  </>
);

const Squares = ({ n = 8 }: { n: number }) => (
  <>
    {Array(n)
      .fill(0)
      .map((_) => (
        <div className=" bg-blue-200 aspect-square"></div>
      ))}
  </>
);
