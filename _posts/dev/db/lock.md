# 락 비교

##

재고량 관리 방법들

먼저 재고량을 RDB에서 관리하냐, REDIS에서 관리하냐로 나눌 수 있습니다.

먼저 RDB에서 관리한다면 디스크에 직접 기록하므로 높은 내구성을 보장할 수 있습니다.

RDB가 다운되어도 다시 재가동하면서 디스크를 읽으면 데이터 유실이 없습니다.

반면에 Redis에서 관리한다면 인 메모리 디비에 작업하므로 확실히 성능상의 이점을 가질 수 있습니다.

특히 쓰기 작업 같은 경우, RDB에서는 lock에 대한 부담이 크지만, 레디스는 부담이 크지 않고 성능이 뛰어납니다.

하지만 Redis는 메모리에 저장하므로 서버가 다운되면 휘발됩니다. 그렇기 때문에 백업이나 클러스터를 통한 failover같은 기능이 잘 구성되어있어야합니다.

그렇기 때문에 RDB로 사용합니다.

테스트에는 jmemter를 사용합니다.

액티브 유저인 number of threads는 1000으로 잡아주고 ramp up period는 10초로 잡아주고 loop count는 1000으로 잡아줍니다.

먼저 낙관적 락을 테스트합니다.

계속해서 실패하는것을 확인할 수 있습니다.

아래 명령어를 입력해봅니다.

SELECT @@transaction_isolation;

![그림2](/assets/img/db/lock/img.png)

isolation level이 REPEATABLE-READ인 것을 확인할 수 있습니다.

show engine innodb status; 를 통해서 트랜잭션 로그를 확인해봅니다.

=====================================
2024-01-11 00:33:03 281472361480128 INNODB MONITOR OUTPUT
=====================================
Per second averages calculated from the last 16 seconds
-----------------
BACKGROUND THREAD
-----------------
srv_master_thread loops: 26 srv_active, 0 srv_shutdown, 873 srv_idle
srv_master_thread log flush and writes: 0
----------
SEMAPHORES
----------
OS WAIT ARRAY INFO: reservation count 21
OS WAIT ARRAY INFO: signal count 19
RW-shared spins 0, rounds 0, OS waits 0
RW-excl spins 0, rounds 0, OS waits 0
RW-sx spins 0, rounds 0, OS waits 0
Spin rounds per wait: 0.00 RW-shared, 0.00 RW-excl, 0.00 RW-sx
------------
TRANSACTIONS
------------
Trx id counter 1917
Purge done for trx's n:o < 1911 undo n:o < 0 state: running but idle
History list length 7
LIST OF TRANSACTIONS FOR EACH SESSION:
---TRANSACTION 562947950211768, not started
0 lock struct(s), heap size 1128, 0 row lock(s)
---TRANSACTION 562947950210960, not started
0 lock struct(s), heap size 1128, 0 row lock(s)
---TRANSACTION 562947950210152, not started
0 lock struct(s), heap size 1128, 0 row lock(s)
---TRANSACTION 562947950201264, not started
0 lock struct(s), heap size 1128, 0 row lock(s)
---TRANSACTION 562947950200456, not started
0 lock struct(s), heap size 1128, 0 row lock(s)
---TRANSACTION 1916, ACTIVE 1 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 2 lock struct(s), heap size 1128, 1 row lock(s)
MySQL thread id 28, OS thread handle 281472362536896, query id 8338 172.21.0.1 stock-study updating
update stock_with_optimistic_lock set remain_quantity=99992, version=8 where id=1 and version=7
Trx read view will not see trx with id >= 1916, sees < 1906
------- TRX HAS BEEN WAITING 1 SEC FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 5 page no 4 n bits 72 index PRIMARY of table `stock-study`.`stock_with_optimistic_lock` trx id 1916 lock_mode X locks rec but not gap waiting
Record lock, heap no 2 PHYSICAL RECORD: n_fields 5; compact format; info bits 0
0: len 8; hex 8000000000000001; asc         ;;
1: len 6; hex 00000000076e; asc      n;;
2: len 7; hex 02000001240151; asc     $ Q;;
3: len 8; hex 8000000000018699; asc         ;;
4: len 4; hex 80000007; asc     ;;

------------------
---TRANSACTION 1915, ACTIVE 1 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 2 lock struct(s), heap size 1128, 1 row lock(s)
MySQL thread id 23, OS thread handle 281472367820736, query id 8329 172.21.0.1 stock-study updating
update stock_with_optimistic_lock set remain_quantity=99992, version=8 where id=1 and version=7
Trx read view will not see trx with id >= 1915, sees < 1905
------- TRX HAS BEEN WAITING 1 SEC FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 5 page no 4 n bits 72 index PRIMARY of table `stock-study`.`stock_with_optimistic_lock` trx id 1915 lock_mode X locks rec but not gap waiting
Record lock, heap no 2 PHYSICAL RECORD: n_fields 5; compact format; info bits 0
0: len 8; hex 8000000000000001; asc         ;;
1: len 6; hex 00000000076e; asc      n;;
2: len 7; hex 02000001240151; asc     $ Q;;
3: len 8; hex 8000000000018699; asc         ;;
4: len 4; hex 80000007; asc     ;;

------------------
---TRANSACTION 1914, ACTIVE 1 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 2 lock struct(s), heap size 1128, 1 row lock(s)
MySQL thread id 21, OS thread handle 281472496820160, query id 8320 172.21.0.1 stock-study updating
update stock_with_optimistic_lock set remain_quantity=99992, version=8 where id=1 and version=7
Trx read view will not see trx with id >= 1914, sees < 1904
------- TRX HAS BEEN WAITING 1 SEC FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 5 page no 4 n bits 72 index PRIMARY of table `stock-study`.`stock_with_optimistic_lock` trx id 1914 lock_mode X locks rec but not gap waiting
Record lock, heap no 2 PHYSICAL RECORD: n_fields 5; compact format; info bits 0
0: len 8; hex 8000000000000001; asc         ;;
1: len 6; hex 00000000076e; asc      n;;
2: len 7; hex 02000001240151; asc     $ Q;;
3: len 8; hex 8000000000018699; asc         ;;
4: len 4; hex 80000007; asc     ;;

------------------
---TRANSACTION 1913, ACTIVE 1 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 2 lock struct(s), heap size 1128, 1 row lock(s)
MySQL thread id 27, OS thread handle 281472363593664, query id 8311 172.21.0.1 stock-study updating
update stock_with_optimistic_lock set remain_quantity=99992, version=8 where id=1 and version=7
Trx read view will not see trx with id >= 1913, sees < 1903
------- TRX HAS BEEN WAITING 1 SEC FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 5 page no 4 n bits 72 index PRIMARY of table `stock-study`.`stock_with_optimistic_lock` trx id 1913 lock_mode X locks rec but not gap waiting
Record lock, heap no 2 PHYSICAL RECORD: n_fields 5; compact format; info bits 0
0: len 8; hex 8000000000000001; asc         ;;
1: len 6; hex 00000000076e; asc      n;;
2: len 7; hex 02000001240151; asc     $ Q;;
3: len 8; hex 8000000000018699; asc         ;;
4: len 4; hex 80000007; asc     ;;

------------------
---TRANSACTION 1912, ACTIVE 1 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 2 lock struct(s), heap size 1128, 1 row lock(s)
MySQL thread id 24, OS thread handle 281472366763968, query id 8308 172.21.0.1 stock-study updating
update stock_with_optimistic_lock set remain_quantity=99992, version=8 where id=1 and version=7
Trx read view will not see trx with id >= 1912, sees < 1903
------- TRX HAS BEEN WAITING 1 SEC FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 5 page no 4 n bits 72 index PRIMARY of table `stock-study`.`stock_with_optimistic_lock` trx id 1912 lock_mode X locks rec but not gap waiting
Record lock, heap no 2 PHYSICAL RECORD: n_fields 5; compact format; info bits 0
0: len 8; hex 8000000000000001; asc         ;;
1: len 6; hex 00000000076e; asc      n;;
2: len 7; hex 02000001240151; asc     $ Q;;
3: len 8; hex 8000000000018699; asc         ;;
4: len 4; hex 80000007; asc     ;;

------------------
---TRANSACTION 1910, ACTIVE 1 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 2 lock struct(s), heap size 1128, 1 row lock(s)
MySQL thread id 25, OS thread handle 281472365707200, query id 8297 172.21.0.1 stock-study updating
update stock_with_optimistic_lock set remain_quantity=99993, version=7 where id=1 and version=6
Trx read view will not see trx with id >= 1910, sees < 1901
------- TRX HAS BEEN WAITING 1 SEC FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 5 page no 4 n bits 72 index PRIMARY of table `stock-study`.`stock_with_optimistic_lock` trx id 1910 lock_mode X locks rec but not gap waiting
Record lock, heap no 2 PHYSICAL RECORD: n_fields 5; compact format; info bits 0
0: len 8; hex 8000000000000001; asc         ;;
1: len 6; hex 00000000076e; asc      n;;
2: len 7; hex 02000001240151; asc     $ Q;;
3: len 8; hex 8000000000018699; asc         ;;
4: len 4; hex 80000007; asc     ;;

------------------
---TRANSACTION 1909, ACTIVE 2 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 2 lock struct(s), heap size 1128, 1 row lock(s)
MySQL thread id 26, OS thread handle 281472364650432, query id 8288 172.21.0.1 stock-study updating
update stock_with_optimistic_lock set remain_quantity=99993, version=7 where id=1 and version=6
Trx read view will not see trx with id >= 1909, sees < 1899
------- TRX HAS BEEN WAITING 2 SEC FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 5 page no 4 n bits 72 index PRIMARY of table `stock-study`.`stock_with_optimistic_lock` trx id 1909 lock_mode X locks rec but not gap waiting
Record lock, heap no 2 PHYSICAL RECORD: n_fields 5; compact format; info bits 0
0: len 8; hex 8000000000000001; asc         ;;
1: len 6; hex 00000000076e; asc      n;;
2: len 7; hex 02000001240151; asc     $ Q;;
3: len 8; hex 8000000000018699; asc         ;;
4: len 4; hex 80000007; asc     ;;

------------------
---TRANSACTION 1908, ACTIVE 2 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 2 lock struct(s), heap size 1128, 1 row lock(s)
MySQL thread id 19, OS thread handle 281472498933696, query id 8279 172.21.0.1 stock-study updating
update stock_with_optimistic_lock set remain_quantity=99993, version=7 where id=1 and version=6
Trx read view will not see trx with id >= 1908, sees < 1898
------- TRX HAS BEEN WAITING 2 SEC FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 5 page no 4 n bits 72 index PRIMARY of table `stock-study`.`stock_with_optimistic_lock` trx id 1908 lock_mode X locks rec but not gap waiting
Record lock, heap no 2 PHYSICAL RECORD: n_fields 5; compact format; info bits 0
0: len 8; hex 8000000000000001; asc         ;;
1: len 6; hex 00000000076e; asc      n;;
2: len 7; hex 02000001240151; asc     $ Q;;
3: len 8; hex 8000000000018699; asc         ;;
4: len 4; hex 80000007; asc     ;;

------------------
---TRANSACTION 1907, ACTIVE 2 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 2 lock struct(s), heap size 1128, 1 row lock(s)
MySQL thread id 20, OS thread handle 281472497876928, query id 8270 172.21.0.1 stock-study updating
update stock_with_optimistic_lock set remain_quantity=99993, version=7 where id=1 and version=6
Trx read view will not see trx with id >= 1907, sees < 1897
------- TRX HAS BEEN WAITING 2 SEC FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 5 page no 4 n bits 72 index PRIMARY of table `stock-study`.`stock_with_optimistic_lock` trx id 1907 lock_mode X locks rec but not gap waiting
Record lock, heap no 2 PHYSICAL RECORD: n_fields 5; compact format; info bits 0
0: len 8; hex 8000000000000001; asc         ;;
1: len 6; hex 00000000076e; asc      n;;
2: len 7; hex 02000001240151; asc     $ Q;;
3: len 8; hex 8000000000018699; asc         ;;
4: len 4; hex 80000007; asc     ;;

------------------
---TRANSACTION 1906, ACTIVE 2 sec
2 lock struct(s), heap size 1128, 1 row lock(s)
MySQL thread id 22, OS thread handle 281472495763392, query id 8340 172.21.0.1 stock-study
Trx read view will not see trx with id >= 1906, sees < 1896
--------
FILE I/O
--------
I/O thread 0 state: waiting for completed aio requests (insert buffer thread)
I/O thread 1 state: waiting for completed aio requests (log thread)
I/O thread 2 state: waiting for completed aio requests (read thread)
I/O thread 3 state: waiting for completed aio requests (read thread)
I/O thread 4 state: waiting for completed aio requests (read thread)
I/O thread 5 state: waiting for completed aio requests (read thread)
I/O thread 6 state: waiting for completed aio requests (write thread)
I/O thread 7 state: waiting for completed aio requests (write thread)
I/O thread 8 state: waiting for completed aio requests (write thread)
I/O thread 9 state: waiting for completed aio requests (write thread)
Pending normal aio reads: [0, 0, 0, 0] , aio writes: [0, 0, 0, 0] ,
ibuf aio reads:, log i/o's:
Pending flushes (fsync) log: 0; buffer pool: 0
1006 OS file reads, 618 OS file writes, 359 OS fsyncs
0.00 reads/s, 0 avg bytes/read, 5.59 writes/s, 4.86 fsyncs/s
-------------------------------------
INSERT BUFFER AND ADAPTIVE HASH INDEX
-------------------------------------
Ibuf: size 1, free list len 0, seg size 2, 0 merges
merged operations:
insert 0, delete mark 0, delete 0
discarded operations:
insert 0, delete mark 0, delete 0
Hash table size 34679, node heap has 0 buffer(s)
Hash table size 34679, node heap has 0 buffer(s)
Hash table size 34679, node heap has 0 buffer(s)
Hash table size 34679, node heap has 0 buffer(s)
Hash table size 34679, node heap has 3 buffer(s)
Hash table size 34679, node heap has 0 buffer(s)
Hash table size 34679, node heap has 0 buffer(s)
Hash table size 34679, node heap has 1 buffer(s)
18.94 hash searches/s, 7.94 non-hash searches/s
---
LOG
---
Log sequence number          31886062
Log buffer assigned up to    31886062
Log buffer completed up to   31886062
Log written up to            31886062
Log flushed up to            31886062
Added dirty pages up to      31886062
Pages flushed up to          31878294
Last checkpoint at           31878294
Log minimum file id is       9
Log maximum file id is       9
195 log i/o's done, 4.71 log i/o's/second
----------------------
BUFFER POOL AND MEMORY
----------------------
Total large memory allocated 0
Dictionary memory allocated 545154
Buffer pool size   8192
Free buffers       7025
Database pages     1163
Old database pages 444
Modified db pages  16
Pending reads      0
Pending writes: LRU 0, flush list 0, single page 0
Pages made young 1, not young 0
0.00 youngs/s, 0.00 non-youngs/s
Pages read 985, created 178, written 329
0.00 reads/s, 0.36 creates/s, 0.49 writes/s
Buffer pool hit rate 1000 / 1000, young-making rate 0 / 1000 not 0 / 1000
Pages read ahead 0.00/s, evicted without access 0.00/s, Random read ahead 0.00/s
LRU len: 1163, unzip_LRU len: 0
I/O sum[0]:cur[0], unzip sum[0]:cur[0]
--------------
ROW OPERATIONS
--------------
0 queries inside InnoDB, 0 queries in queue
10 read views open inside InnoDB
Process ID=1, Main thread ID=281472401391552 , state=sleeping
Number of rows inserted 3, updated 7, deleted 0, read 322
0.06 inserts/s, 0.44 updates/s, 0.00 deletes/s, 20.12 reads/s
Number of system rows inserted 66, updated 374, deleted 8, read 4987
0.00 inserts/s, 0.00 updates/s, 0.00 deletes/s, 0.00 reads/s
----------------------------
END OF INNODB MONITOR OUTPUT
============================

확인해보면 트랜잭션 1916, 1915, 1914 ... 등등이 계속해서 id = 1인 레코드에 X 락을 점유하려고 시도하고 있습니다.

아래 쿼리를 실행하려고 하고 있습니다.

update stock_with_optimistic_lock set remain_quantity=99992, version=8 where id=1 and version=7

엄청난 쓰레드 경합이 일어나고 있는데요.

먼저 InnoDB엔진은 mvcc를 활용하기 때문에 repeatable read여도 큰 문제가 안될거라고 생각했지만

범위 쿼리를 위한 갭 잠금: 반복 읽기에서 InnoDB는 인덱스 레코드에 대한 레코드 잠금과 인덱스 레코드 사이의 간격에 대한 간격 잠금의 조합인 다음 키 잠금을 사용합니다. 이렇게 하면 팬텀 읽기를 방지할 수 있지만, 특히 범위 쿼리나 인덱스 스캔에서 더 많은 잠금이 발생할 수 있습니다.

