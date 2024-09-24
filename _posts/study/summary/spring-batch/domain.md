# JobLauncher
1. job을 실행시키는 객체
2. job과 parameter를 인자로 받는다.
3. job을 여러번 동작시켰을때, 파라미터를 기준으로 구분한다.
4. 같은 파라미터로 job 인스턴스를 만들 수 없다.


spring.batch.job.enabled

# StepContribution
1. StepExecution이 만들어진다.
2. StepContribution이 만들어진다.
3. ChunkOrientedTasklet이 만들어진다.
4. ItemReader, ItemProcessor, ItemWrite가 동작하고, 그 결과를 StepContribution에 저장한다.
5. 해당 내용을 StepExecution에 저장한다.

# StepExecution
ExecutionContext context

ChunkOrientedTasklet