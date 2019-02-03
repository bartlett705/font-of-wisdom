#just a bunch of random snippets
CREATE TABLE hammers (
    call varchar(12) PRIMARY KEY,
    name varchar(255),
    addr1 varchar(255),
    addr2 varchar(255),
    addr3 varchar(255),
    zip int
);

ALTER TABLE hammers 
ADD PRIMARY KEY (call);

SELECT * FROM hammers
WHERE name LIKE '%russel%' 
  AND zip > 9000

select distinct addr3 from hammers

SELECT COUNT(name) FROM hammers
WHERE addr3 = 'CA';

SELECT COUNT(name), addr3
FROM hammers
GROUP BY addr3
ORDER BY COUNT(name) DESC;

SELECT call FROM hammers
WHERE zip = 92056 OR zip > 920560000 AND zip < 920570000;

pg_dump -C hams | bzip2 | ssh -p 5235 -i /home/phylo/new_code/undefined/ci/travis_ci_rsa  postgres@mosey.systems "bunzip2 | psql hams"