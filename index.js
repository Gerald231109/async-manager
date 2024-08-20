
class TaskManager {
    execute = document.querySelector('.execute')
    withInterval = document.querySelector('#status')
    duration = document.querySelector('.interval')
    status = document.querySelector('.task-status')
    withTimeout = document.querySelector('#timeout');
    timeout = document.querySelector('.miliseconds');
    footer = document.querySelector('.footer');
    canceled = document.querySelector('.canceled');
    tasks = new Map();
    tasksByPriority;
   
    constructor(num) {
        
        this.execute.addEventListener('click', () => this.executeTasks());
        this.count = num
    }

    tasksCount() {
        return this.tasks.size
    }

    addTask(task, priority, deps) {
        this.tasks.set(`task${this.tasksCount()+1}`, {task, priority, deps}) 
        this.canceled.innerHTML = ''
        for (let [key, _] of this.tasks) {
            this.canceled.insertAdjacentHTML('beforeend', `
            <div class="cancel-task">
                <input type="checkbox" id="${key}" class='cancel' checked>
                <label for="${key}" class="cancel-name">${key}</label>
            </div>`)
        }
    }

    sortTasks(){
        this.tasksByPriority = new Map([...this.tasks.entries()].sort(([, valueA], [, valueB]) => valueB.priority - valueA.priority))
    }

    timeoutTask(task) {
        return new Promise((resolve, reject) => setTimeout(async () => {
            await task().catch(() => reject())
            resolve()
        }, this.timeout.value))
    }

    disableInterface() {
        this.withInterval.disabled = true;
        this.withTimeout.disabled = true;
        this.duration.disabled = true;
        this.timeout.disabled = true;
        this.execute.disabled = true;
    }

    getStatus() {
        this.disableInterface()
        if(this.withInterval.checked) {
            this.interval = setInterval(() => {
                this.status.innerHTML = ``
                this.tasks.forEach((value, key) => {
                    this.status.insertAdjacentHTML('beforeend', `
                    <p class="task" style="color:${!value.result ? '#fff' : value.result === 'fulfilled' ? '#A1DD70' : '#BF3131'}">Текущий статус ${key} - ${value.result || 'pending'}</p>
                    `)
                })
                
            }, this.duration.value);
        } else {
            this.status.innerHTML = `<p class="without-status">
                Tasks are running in the background, please wait...
            </p>`
        }
    }

    checkCanceled() {
        const allTasks = document.querySelectorAll('.cancel')
        Array.from(allTasks).forEach((task) => {if(!task.checked) this.tasks.get(task.id).result = 'rejected'})
    }

    async executeTasks() {
        const chunk = []
        const keys = []
        this.checkCanceled()
        this.sortTasks()
        const values = [...this.tasksByPriority.values()]
        this.getStatus()
        let iteration = 0;
        for(let [key, task] of this.tasksByPriority) {
            if(task.result === 'rejected') {
                iteration++
                continue
            };
            if(task.deps.some((dep) => this.tasks.get(dep).result === 'rejected')) {
                this.tasks.get(key).result = 'rejected';
                iteration++;
                continue;
            }
            chunk.push(task.task)
            keys.push(key)
            if(chunk.length === this.count || task.deps.length || values[iteration+1].deps.length || values.length === iteration+1) {
                const promises = chunk.map((task) => this.withTimeout.checked ? this.timeoutTask(task) : task())
                await Promise.allSettled(promises)
                .then((result) => {
                    result.forEach((res, index) => {
                        this.tasks.get(keys[index]).result = res.status;
                    })
                    chunk.length = 0
                    keys.length = 0  
                })
            }
            iteration++
        }
        if(!this.withInterval.checked) {
            this.status.innerHTML = 
            `<p class="without-status">
                The tasks are completed. Reload the page to try them again.
            </p>`
        }
    }
}


const taskManager = new TaskManager(1)

taskManager.addTask(async () => {
    console.log('Выполнение задачи 1');
    await new Promise(resolve=> setTimeout(resolve, 2000));
    console.log('Задача 1 завершена');
    }, 2, []);

taskManager.addTask(async () => {
    console.log('Выполнение задачи 2');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Задача 2 завершена');
    }, 1, ['task1']);
taskManager.addTask(async () => {
    console.log('Выполнение задачи 3');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Задача 3 завершена');
}, 3, []);
taskManager.addTask(async () => {
    console.log('Выполнение задачи 4');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Задача 4 завершена');
    }, 1, ['task2', 'task3']);
taskManager.addTask(async () => {
        console.log('Выполнение задачи 5');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Задача 5 завершена');
        }, 3, []);
taskManager.addTask(async () => {
        console.log('Выполнение задачи 6');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Задача 6 завершена');
        }, 2, []);

