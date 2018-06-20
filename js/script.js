window.addEventListener('DOMContentLoaded', function(){

	//вставка текущей даты на сайт
	let d = new Date(),
			month=new Array("января","февраля","марта","апреля","мая","июня",
			"июля","августа","сентября","октября","ноября","декабря"),
	    dataTitle = document.querySelector('h1>span');

	    dataTitle.textContent = `${d.getDate()} ${month[d.getMonth()]} ${d.getFullYear()}`;

	//==============настройка отображения карточек вакансий на странице====================

	//относятся к загрузке всех вакансий
	let	vacancyCount,
			pageCount = 3,
			pageNumber = document.getElementById("page_number"),
			pageCurrentNumber,
			vacancyCountLast = 37,
			vacancyCountTotal = 237,
			vacanciesNavNumber = document.querySelector('.vacancies-nav__number'),
			vacanciesNavPageTotal = document.querySelector('.vacancies-nav__block>span'),
			vacanciesNavNext = document.querySelector('.vacancies-nav__next'),
			vacanciesNavPrev = document.querySelector('.vacancies-nav__prev'),
			selector = document.getElementById('page_number'),
	//относятся к загрузке всех кандидатов определенной вакансии
			vacancies = document.querySelector('.vacancies'),
			overlay = document.querySelector('.overlay'),
	//относятся к загрузке карточки кандидата
			noSelectCand = document.querySelector('.popup-body__candidate_text'),
			candCard = document.querySelector('.popup-body__candidate_descr'),
			candData = document.getElementsByClassName('descr_data'),
			selectStatus = -1,
  //относятся к сообщению-оповещению при загрузки данных с сервера
			message = {},
			statusMessage = document.querySelector('.status-message'),
			statusMessageCandidate = document.querySelector('.status-message-candidate'),
			statusMessageVacancy = document.querySelector('.status-message-vacancy');
  
  
	// создание сообщение-оповещение при загрузки данных с сервера
	message.loading = "Загрузка...";
	message.failure = "Произошла ошибка. Попробуйте перезагрузить страницу";
	message.sucsess = '';

	//анализ строки запроса, добавление/удаление/изменение параметра
	function lineChange (param, val, action) {
		let line = window.location.hash,
				data = line.replace('#?',''),
				pairs = data.split('&'),
				tmp = [],
				search = {};
		if (line.indexOf("?") !== -1) {
			for (let i = 0; i < pairs.length; i++) {
				tmp = pairs[i].split('=');
	   		search[tmp[0]] = tmp[1];
			}
		}
		if (action == 'add') {
			search[param] = val;
		} else if (action == 'del') {
			delete search[param];
		}
		let newLine = '';
		delete search[0];
		for (let key in search) {
      if(search.hasOwnProperty(key)) {
				let enKey = encodeURIComponent(key),
						enValue = encodeURIComponent(search[key]);
				newLine = newLine+`${enKey}=${enValue}&`;
      }
		}
		newLine = newLine.slice(0, -1);
		// передача параметров отображения в адресную строку
		document.location.hash = `?${newLine}`;

		if (action == 'test') {
			return search;
		}
	}

	//проверяем, первая ли загрузка страницы или перезагрузка с настроенными параметрами
	if (window.location.hash === '') {
		vacancyCount = 100;
		pageCurrentNumber = 1;
	} else {
		let search = lineChange (0, 0, 'test');
		vacancyCount = search.limit;
		pageCurrentNumber = search.page;

		if (search.vacancy > 0) {
			getCandidatesList(search.vacancy);
		}
		
		if (search.candidate > 0) {
			candidateCard(search.candidate);
			selectStatus = search.sel;
		}

		pageTotal();
		vacanciesNavNumber.value = vacancyCount;
		vacanciesNavPageTotal.textContent = pageCount;
		addList(pageCount);
		buttonClass(pageCurrentNumber);
		document.querySelectorAll('option')[pageCurrentNumber-1].selected = true;
	}

	//первое отображение при перезагрузке страницы
	getVacancies (vacancyCount, pageCurrentNumber);


	//изменение количества элементов на странице
	vacanciesNavNumber.addEventListener('change', () => {
	 	let vacanciesNavNumberValue = vacanciesNavNumber.value;
	 		
 		//проверяем на правильность ввода числа
 		if ((+vacanciesNavNumberValue < 5) || (+vacanciesNavNumberValue > 237) || ((+vacanciesNavNumberValue*10%10) !== 0)) {
 			alert('Пожалуйста, введите целое число от 5 до 237');
 			vacanciesNavNumber.value = 100;
 		} else {
				// меняем количество отображаемых вакансий
				vacancyCount = vacanciesNavNumberValue;
				pageTotal();				
		}
			
		//добавляем в выпадающий список нужное кол-во страниц и общее их число
		vacanciesNavPageTotal.textContent = pageCount;
		addList(pageCount);
		getVacancies (vacancyCount, 1);
		vacanciesNavPrev.classList.remove('vacancies-nav__prev_active');
		vacanciesNavNext.classList.add('vacancies-nav__next_active');
	});

	//выбор страницы из выпадающего списка
	pageNumber.addEventListener('change', () => {
		buttonClass(pageNumber.value);
		getVacancies (vacancyCount, pageNumber.value);
	});

	// вычисляем количество полностью заполненных страниц
	function pageTotal() {
		pageCount = Math.floor(vacancyCountTotal/vacancyCount);
		// если остаются вакансии, помимо цельно заполненных страниц - добавляем еще одну страничку
		//+вычисляем сколько вакансий на последней странице
		if ((vacancyCountTotal-vacancyCount*pageCount) > 0){
			vacancyCountLast = vacancyCountTotal-vacancyCount*pageCount;
			pageCount++;
		} else {
			//кол-во вакансий на последней странице такое же, что и на всех остальных
			vacancyCountLast = vacancyCount;
		}
	}


	//меняем кол-во элементов в выпадающем списке страниц
	function addList (nom) {
		let option = document.querySelectorAll('option');

		if (option.length > nom) {
			for (let i = option.length; i > nom; i--) {
				selector.removeChild(option[i-1]);
			}
		} else if (option.length < nom ) {

			for (let i = option.length; i < nom; i++) {
				let newOption = option[0].cloneNode(true);
				newOption.value = i+1;
				newOption.textContent = i+1;
				selector.appendChild(newOption);
			}
			option[0].selected = true;
		}
	}

	//запрос вакансий на страницу в соответствии с параметрами отображения
	function getVacancies (limit, page) {
	 	let xmlhttp=new XMLHttpRequest();
	 	xmlhttp.onreadystatechange=function() {
	 		if (xmlhttp.readyState < 4) {
				//statusMessage.textContent = message.loading;
			} else if (xmlhttp.readyState === 4) {
				if (xmlhttp.status == 200) {
					statusMessage.textContent = message.sucsess;
					addVacanciesCards(xmlhttp);
				} else {
					statusMessage.textContent = message.failure;
				}
			}
	 	};
	 	lineChange('limit', limit, 'add');
	 	lineChange('page', page, 'add');
	 	xmlhttp.open("GET",`http://85.142.162.25:23080/api/list?limit=${limit}&page=${page}`,true);
	 	xmlhttp.send();
	}

	//добавление карточек вакансий в соответствии с параметрами отображения
	function addVacanciesCards(xmlhttp){
		let list = JSON.parse(xmlhttp.responseText),
				items = list.items,
				vacancy = document.querySelector('.vacancy'),
				vacancyShow = document.querySelectorAll('.vacancy_show');
		//добавление или удаление карточек
		if (vacancyShow.length < items.length) {
			for (let i = vacancyShow.length; i < items.length; i++) {
				let newVacancy = vacancy.cloneNode(true);
				newVacancy.classList.add("vacancy_show");
				vacancy.parentNode.appendChild(newVacancy);
			}
		} else if (vacancyShow.length > items.length) {
			for (let i = vacancyShow.length; i > items.length; i--) {
				vacancy.parentNode.removeChild(vacancyShow[i-1]);
			}
		}
		addVacanciesDescription(items);
	}

	//заполнение карточек с вакансиями данными
	function addVacanciesDescription(items) {
		let	vacancyId = document.getElementsByClassName('vacancy__id'),
				vacancyStatus = document.querySelectorAll('div.vacancy__status > span'),
				vacancyTitle = document.getElementsByClassName('vacancy__title'),
				vacancyOrganization = document.getElementsByClassName('vacancy__organization'),
				vacancyCreatetime = document.getElementsByClassName('vacancy__createtime'),
				vacancyCity = document.getElementsByClassName('vacancy__city'),
				vacancyBtn = document.getElementsByClassName('vacancy__btn');

		for (let i = 1; i <= items.length; i++) {
			vacancyId[i].textContent = `#${items[i-1].id}`;
			vacancyStatus[i].textContent = items[i-1].status;
			vacancyTitle[i].textContent = items[i-1].title;
			vacancyOrganization[i].textContent = items[i-1].organization;
			let str = items[i-1].createtime;
			vacancyCreatetime[i].textContent = `${str.substring(8, 10)}.${str.substring(5, 7)}.${str.substring(0, 4)} в ${str.substring(11, 16)}`;
			vacancyCity[i].textContent = items[i-1].city;
			vacancyBtn[i].value = items[i-1].id;
		}
	}

	//навигация по страницам с помощью кнопок вперед-назад
	vacanciesNavNext.addEventListener('click', () => {
		let nextPage = +selector.value+1,
				option = document.querySelectorAll('option');
		if (nextPage < pageCount) {
			option[nextPage-1].selected = true;
			getVacancies (vacancyCount, pageNumber.value);
			vacanciesNavPrev.classList.add('vacancies-nav__prev_active');
		} else if (nextPage == pageCount) {
			option[nextPage-1].selected = true;
			getVacancies (vacancyCount, pageNumber.value);
			vacanciesNavNext.classList.remove('vacancies-nav__next_active');
		}
		option[nextPage-1].selected = true;
	});

	vacanciesNavPrev.addEventListener('click', () => {
		let prevPage = +selector.value-1,
				option = document.querySelectorAll('option');
		if (prevPage > 1) {
			option[prevPage-1].selected = true;
			getVacancies (vacancyCount, pageNumber.value);
			vacanciesNavNext.classList.add('vacancies-nav__next_active');
		} else if (prevPage == 1) {
			option[prevPage-1].selected = true;
			getVacancies (vacancyCount, pageNumber.value);
			vacanciesNavPrev.classList.remove('vacancies-nav__prev_active');
		}
		option[prevPage-1].selected = true;
	});

	//функция отображения активности кнопок навигации
	function buttonClass(pageNumber) {
		if (pageNumber == 1) {
			vacanciesNavPrev.classList.remove('vacancies-nav__prev_active');
			vacanciesNavNext.classList.add('vacancies-nav__next_active');
		} else if (pageNumber == pageCount) {
			vacanciesNavPrev.classList.add('vacancies-nav__prev_active');
			vacanciesNavNext.classList.remove('vacancies-nav__next_active');
		} else {
			vacanciesNavPrev.classList.add('vacancies-nav__prev_active');
			vacanciesNavNext.classList.add('vacancies-nav__next_active');
		}
	}

	//========================выбока по id вакансии============================

	//открытие окна с кандидатами по клику на вакансию
	vacancies.addEventListener('click', function(event){
		if (event.target && event.target.matches('button.vacancy__btn')) {
			getCandidatesList(event.target.value);
		}		
	});

	//подготовка окна с данными по вакансии
	function getCandidatesList(nom) {
			overlay.style.display = 'block';
			document.body.style.overflow = "hidden";
			getCandidates (nom);
			lineChange ('vacancy', nom, 'add');
	}

	//запрос списка кандидатов по ID
	function getCandidates (id) {
	 	let xmlhttp=new XMLHttpRequest();
	 	xmlhttp.onreadystatechange=function() {
	 		if (xmlhttp.readyState < 4) {
				//statusMessageVacancy.textContent = message.loading;
			} else if (xmlhttp.readyState === 4) {
				if (xmlhttp.status == 200) {
					statusMessageVacancy.textContent = message.sucsess;
					//добавляем карточки кандидатов
	 	    	addCandidatesCards(xmlhttp);
				} else {
					statusMessageVacancy.textContent = message.failure;
				}
			}
	 	};
	 	xmlhttp.open("GET",`http://85.142.162.25:23080/api/list/${id}`,true);
	 	xmlhttp.send();
	}

  //добавляем каточки с кандидатами
	function addCandidatesCards(xmlhttp){
		let list = JSON.parse(xmlhttp.responseText),
				items = list.items,
				nodata = document.querySelector('.popup__tdata_nodata'),
				candidate = document.querySelector('.popup__tdata'),
				popupTitle = document.querySelector('.popup-title');

		if (items.length == 1) {
			nodata.style.display = 'none';
			candidate.style.display = 'flex';
			addCandidatesDescription(items);
		} else if (items.length > 1) {
			nodata.style.display = 'none';
			candidate.style.display = 'flex';
			for (let i = 1; i < items.length; i++) {
				let newCandidate = candidate.cloneNode(true);
				if ((selectStatus > 0) && (i == selectStatus)) {
					newCandidate.classList.add('popup__tdata_click');
				}
				candidate.parentNode.appendChild(newCandidate);
			}
			addCandidatesDescription(items);
		}
		popupTitle.textContent = list.service_name;
		if (selectStatus === 0)  {
			candidate.classList.add('popup__tdata_click');
		}
	}

	//заполнение данных по кандидатам
	
	function addCandidatesDescription(items) {
		let	tdataСandidate = document.getElementsByClassName('popup__tdata_candidate'),
				tdataStatus = document.getElementsByClassName('popup__tdata_status'),
				tdata = document.getElementsByClassName('popup__tdata'),
				middlename;

		for (let i = 0; i < items.length; i++) {
			if (items[i].middlename) {
				middlename = items[i].middlename;
			} else {
				middlename = '';
			}
			tdataСandidate[i].textContent = `${items[i].lastname} ${items[i].firstname} ${middlename}`;
			tdataStatus[i].textContent = items[i].status;
			tdata[i].value = items[i].id;
			tdata[i].id = i;
		}
	}

	//удаление карточек кандидатов при закрытии окна с вакансией
	function deleteCandidatesCards(){
		let nodata = document.querySelector('.popup__tdata_nodata'),
				candidates = document.querySelectorAll('.popup__tdata');

		if (candidates.length == 1) {
			nodata.style.display = 'block';
			candidates[0].style.display = 'none';
		} else if (candidates.length > 1) {
			nodata.style.display = 'block';
			candidates[0].style.display = 'none';
			for (let i = 1; i < candidates.length; i++) {
				candidates[0].parentNode.removeChild(candidates[i]);
			}
		}
	}
	

	//=================== отображение контактных данных кандидата =============================

	//управление отображением данных кандидата
	overlay.addEventListener('click', function(event){
		//если кликнули по кандидату - отображаем информацию о нем
		if (event.target && (event.target.matches('div.popup__tdata_candidate') || event.target.matches('div.popup__tdata_status'))) {
			deleteCheckClass ();
			event.target.parentNode.classList.add('popup__tdata_click');
			let candId = event.target.parentNode.value;
			lineChange ('candidate', candId, 'add');
			lineChange ('sel', event.target.parentNode.id, 'add');
			candidateCard(candId);
	
			//если кликнули по крестику - закрываем карточку вакансии и очищаем данные
		}	 else if (event.target && event.target.matches('div.popup-close')) {
			deleteCandidatesCards();
			overlay.style.display = 'none';
			document.body.style.overflow = "";
			deleteCheckClass ();
			lineChange ('vacancy', 0, 'del');
			lineChange ('candidate', 0, 'del');
			lineChange ('sel',  0, 'del');
			noSelectCand.style.display = 'block';
			candCard.style.display = 'none';

			//если кликнули не по крестику и не по кандидату - сбрасываем выборку кандидата
		}	else {
			deleteCheckClass ();
			lineChange ('candidate', 0, 'del');
			lineChange ('sel',  0, 'del');
			noSelectCand.style.display = 'block';
			candCard.style.display = 'none';
		}
	});

	//показ карточки кандидата
	function candidateCard(candId) {
		//запрос на сервер
		getCard (candId);
		noSelectCand.style.display = 'none';
		candCard.style.display = 'block';
	}

	//запрос карточки кандидата по ID
	function getCard (id) {
	 	let xmlhttp=new XMLHttpRequest();
	 	xmlhttp.onreadystatechange=function() {
	 		if (xmlhttp.readyState < 4) {
				//statusMessageCandidate.textContent = message.loading;
			} else if (xmlhttp.readyState === 4) {
				if (xmlhttp.status == 200) {
					statusMessageCandidate.textContent = message.sucsess;
					//заполняем карточку кандидата
	 	  		addCardsData (xmlhttp);
				} else {
					statusMessageCandidate.textContent = message.failure;
				}
			}
	 	};
	 	xmlhttp.open("GET",`http://85.142.162.25:23080/api/vacancy/${id}`,true);
	 	xmlhttp.send();
	}

	//заполняем информацию по кандидату:
	function addCardsData (xmlhttp) {
		let list = JSON.parse(xmlhttp.responseText),
				items = list[0];
		
		candData[0].textContent = items.lastname;
		candData[1].textContent = items.firstname;
		candData[2].textContent = items.middlename;
		candData[3].textContent = items.phone;
		candData[4].textContent = items.email;
	}

	//удаление у кандидата "выбранности"
	function deleteCheckClass () {
		let popupTdata = document.getElementsByClassName('popup__tdata');
		for (let i=0; i<popupTdata.length; i++) {
			popupTdata[i].classList.remove('popup__tdata_click');
		}
	}

});