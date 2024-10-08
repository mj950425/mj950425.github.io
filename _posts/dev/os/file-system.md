파일 시스템 (File System)

	1.	메타 데이터 관리: 파일 시스템은 파일과 디렉토리의 메타 데이터를 관리합니다. 메타 데이터에는 파일의 이름, 크기, 생성 및 수정 날짜, 접근 권한, 그리고 파일이 저장된 블록의 위치 정보 등이 포함됩니다.
	2.	파일 경로 탐색: 사용자가 특정 파일을 요청하면, 파일 시스템은 해당 파일의 경로를 따라 디렉토리를 탐색하여 파일의 메타 데이터를 찾습니다.
	3.	블록 위치 결정: 파일 시스템은 파일의 메타 데이터에서 파일이 저장된 블록의 위치를 확인합니다. 이 정보는 블록 계층에 전달되어 실제 데이터 접근을 요청합니다.

블록 계층 (Block Layer)

	1.	블록 관리: 블록 계층은 파일 시스템에서 전달받은 블록 위치 정보를 기반으로 하드 디스크의 특정 블록에 접근합니다. 블록 계층은 각 블록의 물리적 위치를 추적하고 관리합니다.
	2.	데이터 읽기/쓰기: 블록 계층은 하드 디스크에 데이터를 읽거나 쓰는 작업을 수행합니다. 하드 디스크의 트랙과 섹터를 찾아 데이터를 실제로 읽어 메모리에 전달하거나, 새로운 데이터를 해당 블록에 씁니다.
	3.	캐싱 및 최적화: 블록 계층은 데이터 접근 속도를 높이기 위해 캐싱과 같은 최적화 기법을 사용할 수 있습니다.

예시를 통한 흐름 설명

	1.	파일 시스템 요청:
	•	사용자가 “document.txt” 파일을 열면 파일 시스템은 “/home/user/document.txt” 경로를 탐색합니다.
	•	이 경로를 따라 파일 시스템은 “document.txt” 파일의 메타 데이터를 찾습니다. 메타 데이터에는 파일이 저장된 블록의 위치 정보가 포함되어 있습니다.
	2.	블록 위치 전달:
	•	파일 시스템은 “document.txt” 파일의 블록 위치 정보를 블록 계층에 전달합니다.
	•	예를 들어, 파일이 블록 100부터 110까지 저장되어 있다고 가정합니다.
	3.	블록 계층 데이터 접근:
	•	블록 계층은 블록 100부터 110까지의 데이터를 읽기 위해 하드 디스크에 요청을 보냅니다.
	•	하드 디스크의 읽기/쓰기 헤드가 해당 블록 위치로 이동하여 데이터를 읽습니다.
	4.	데이터 반환:
	•	블록 계층은 읽은 데이터를 파일 시스템에 반환합니다.
	•	파일 시스템은 데이터를 사용자나 애플리케이션이 사용할 수 있도록 변환하여 전달합니다.