var timerConfig;
if ( !localStorage.timerConfig )
{
    timerConfig =
    {
        "timers":
        [
            {
                "name": "pomodoro",
                "timerLength": 60 * 25
            },
            {
                "name": "shortBreak",
                "timerLength": 60 * 5
            },
            {
                "name": "longBreak",
                "timerLength": 60 * 10
            }
        ],
        "timerSequence":
        [
            "pomodoro",
            "shortBreak",
            "pomodoro",
            "shortBreak",
            "pomodoro",
            "shortBreak",
            "pomodoro",
            "longBreak"
        ],
        "locales":
        {
            "startTimer": "Start",
            "stopTimer": "Pause",
            "cycleText": "Cycle {cycleNumber}"
        },
        "state":
        {
            "cycle": 1,
            "mode": "pomodoro",
            "timeRemaining": 60 * 25
        }
    };

    localStorage.timerConfig = JSON.stringify( timerConfig );
}
else
{
    timerConfig = JSON.parse( localStorage.timerConfig );
}

var tasks;
if ( !localStorage.tasks )
{
    tasks = []

    localStorage.tasks = JSON.stringify( tasks );
}
else
{
    tasks = JSON.parse( localStorage.tasks );
}

const SETTINGS_CHANGE_EVENT = new CustomEvent( "pt:settingsChange" );

function initThemeToggle( )
{
    function toggleTheme( )
    {
        if ( document.documentElement.classList.contains( "dark" ) )
        {
            localStorage.theme = "light";
            document.documentElement.classList.remove( "dark" );
        }
        else
        {
            localStorage.theme = "dark";
            document.documentElement.classList.add( "dark" );
        }
    }

    const themeToggle = document.querySelector( ".js-theme-toggle" );
    themeToggle.addEventListener( "click", toggleTheme );
}

initThemeToggle( );

function initPomodoroTimer( )
{
    const timerTypes = document.querySelectorAll( ".js-timer-type" );
    const timerProgress = document.querySelector( ".js-timer-progress" );
    const timerTimer = document.querySelector( ".js-timer-time" );
    const timerCycle = document.querySelector( ".js-timer-cycle" );
    const timerToggle = document.querySelector( ".js-timer-toggle" );
    const timerSkip = document.querySelector( ".js-timer-skip" );

    var timeRemaining = timerConfig.state.timeRemaining;
    var currentTimer;
    var currentCycle = timerConfig.state.cycle;
    
    var currentMode = timerConfig.state.mode;
    var modeList = timerConfig.timers;
    var timerSequence = timerConfig.timerSequence;
    var currentSequenceIndex = 0;

    function getModeConfig( modeName )
    {
        const index = modeList.map( ( mode ) => { return mode.name } ).indexOf( modeName );
        if ( index !== -1 )
        {
            return modeList[ index ];
        }
        else
        {
            return null;
        }
    }

    function updateTime( )
    {
        timeRemaining --;

        if ( timeRemaining == 0 )
        {
            clearTimer( );
            var index = timerSequence.indexOf( currentMode, currentSequenceIndex );

            if ( index !== -1 )
            {
                index ++;
                if ( index + 1 >= timerSequence.length )
                {
                    currentCycle ++;
                    switchTimerType( timerSequence[ 0 ] );
                }
                else
                {
                    switchTimerType( timerSequence[ index ] );
                }
            }
        }
        else
        {
            renderUpdatedTime( timeRemaining );
            updateSessionState( );
        }
    }

    function renderUpdatedTime( timeRemaining )
    {
        const currentModeConfig = getModeConfig( currentMode );
        const totalTime = currentModeConfig.timerLength;
        timerProgress.setAttribute( "style", "--timer-degrees: " + ( ( totalTime - timeRemaining ) / totalTime * 360 ) + "deg;" );

        const hours = Math.floor( timeRemaining / 60 );
        const seconds = timeRemaining % 60;
        timerTimer.textContent = `${ hours }:${ String( seconds ).padStart( "2", 0 ) }`;

        timerCycle.textContent = timerConfig.locales.cycleText.replace( "{cycleNumber}", currentCycle );
    }

    function handleTimerType( event )
    {
        const timerTypeEl = event.target;
        const timerType = timerTypeEl.dataset.timerType;

        switchTimerType( timerType );
    }

    function switchTimerType( timerType )
    {
        clearTimer( currentTimer );
        const modeConfig = getModeConfig( timerType );
        if ( modeConfig )
        {
            currentMode = modeConfig.name;
            timeRemaining = modeConfig.timerLength;
            setTimerModeStyling( timerType );

            renderUpdatedTime( timeRemaining );
            timerToggle.textContent = timerConfig.locales.startTimer;
            updateSessionState( );
            skipVisibility( false );
        }
    }

    function setTimerModeStyling( timerMode )
    {
        timerTypes.forEach( ( timerType ) =>
        {
            if ( timerType.dataset.timerType != timerMode )
            {
                timerType.classList.remove( "timer-type-active" );
                timerType.classList.add( "hover:bg-neutral-50/10" );
            }
            else
            {
                timerType.classList.add( "timer-type-active" );
            }
        });
    }

    function clearTimer( )
    {
        clearInterval( currentTimer );
        currentTimer = undefined;
    }

    function toggleTimer( )
    {
        if ( currentTimer )
        {
            clearTimer( );
            timerToggle.textContent = timerConfig.locales.startTimer;
            skipVisibility( false );
        }
        else
        {
            currentTimer = setInterval( updateTime, 1000 );
            timerToggle.textContent = timerConfig.locales.stopTimer;
            skipVisibility( true );
        }
    }

    function skipVisibility( visible )
    {
        if ( visible === true )
        {
            timerSkip.classList.remove( "w-0", "opacity-0" );
            timerSkip.classList.add( "w-12", "pointer-events-auto" );
        }
        else
        {
            timerSkip.classList.add( "w-0", "opacity-0" );
            timerSkip.classList.remove( "w-12", "pointer-events-none" );
        }
    }

    function skipMode( )
    {
        var index = timerSequence.indexOf( currentMode, currentSequenceIndex );
        if ( index + 1 >= timerSequence.length )
        {
            currentCycle ++;
            switchTimerType( timerSequence[ 0 ] );
        }
        else
        {
            switchTimerType( modeList[ index + 1 ] );
        }
    }

    function updateSessionState( )
    {
        try {
            timerConfig.state.cycle = currentCycle;
            timerConfig.state.mode = currentMode;
            timerConfig.state.timeRemaining = timeRemaining;
            localStorage.timerConfig = JSON.stringify( timerConfig );
        }
        catch ( error )
        {
            if ( error instanceof TypeError )
            {
                const resetConfirm = confirm( "There is an error in the timer configuration - you must reset it. This will delete timer related history and settings." );
                if ( resetConfirm )
                {
                    localStorage.removeItem( "timerConfig" );
                    window.location.reload( );
                }
            }
            else
            {
                console.warn( "Something went wrong saving the timer state - " + error );
            }
        }
    }

    function handleSettingsChange( )
    {
        timeRemaining = timerConfig.state.timeRemaining;
        clearTimer( currentTimer );
        currentTimer = undefined;
        currentCycle = timerConfig.state.cycle;
        currentMode = timerConfig.state.mode;
        modeList = timerConfig.timers;
        timerSequence = timerConfig.timerSequence;

        setTimerModeStyling( currentMode )
        renderUpdatedTime( timeRemaining );
        skipVisibility( false );
    }

    timerTypes.forEach( ( timerType ) =>
    {
        timerType.addEventListener( "click", handleTimerType );
    });

    timerToggle.addEventListener( "click", toggleTimer );

    timerSkip.addEventListener( "click", skipMode );

    window.addEventListener( "pt:settingsChange", handleSettingsChange );

    setTimerModeStyling( currentMode )
    renderUpdatedTime( timeRemaining );
    skipVisibility( false );
}

function initPomodoroTasks( )
{
    const taskAdd = document.querySelector( ".js-task-add" );
    const taskAddModal = document.querySelector( ".js-task-add-modal" );
    const taskAddInput = document.querySelector( ".js-task-add-input ");
    const taskAddSave = document.querySelector( ".js-tasks-save" );
    const taskAddCancel = document.querySelector( ".js-tasks-cancel" );
    const taskTemplate = document.querySelector( ".js-task-template" );
    const taskList = document.querySelector( ".js-task-list" );

    function updateSessionTasks( )
    {
        try {
            localStorage.tasks = JSON.stringify( tasks );
        }
        catch ( error )
        {
            if ( error instanceof TypeError )
            {
                const resetConfirm = confirm( "There is an error in the tasks configuration - you must reset it. This will delete any tasks." );
                if ( resetConfirm )
                {
                    localStorage.removeItem( "tasks" );
                    window.location.reload( );
                }
            }
            else
            {
                console.warn( "Something went wrong saving the tasks - " + error );
            }
        }
    }

    function findTaskIndexByUUID( uuid )
    {
        var taskIndex = tasks.map( ( task ) => { return task.uuid } ).indexOf( uuid );
        if ( taskIndex === -1 )
        {
            return null;
        }
        return taskIndex;
    }

    function displayTask( task )
    {
        const taskEl = taskTemplate.cloneNode( true );
        taskEl.classList.remove( "js-task-template", "hidden" );
        taskEl._UUID = task.uuid;
        taskEl.querySelector( ".js-task-text" ).textContent = task.taskDetails;
        taskEl.querySelector( ".js-tasks-delete" ).addEventListener( "click", handleTaskDelete );
        taskEl.querySelector( ".js-tasks-edit" ).addEventListener( "click", handleTaskEdit );
        taskEl.removeAttribute( "style" );
        taskList.appendChild( taskEl );
    }

    function reRenderAllTasks( )
    {
        taskList.querySelectorAll( ".js-task:not( .js-task-template )" ).forEach( el =>
        {
            el.remove( );
        });

        tasks.forEach( task => displayTask( task ) );
    }

    function toggleTaskAddModal( )
    {
        if ( taskAddModal.classList.contains( "opacity-0" ) )
        {
            taskAddModal.classList.remove( "opacity-0", "pointer-events-none" );
            taskAddInput.focus( );
        }
        else
        {
            taskAddModal.classList.add( "opacity-0", "pointer-events-none" );
        }
    }

    function addTask( taskDetails )
    {
        tasks.push( { "uuid": window.crypto.randomUUID( ), "taskDetails": taskDetails } );
        localStorage.tasks = JSON.stringify( tasks );
        reRenderAllTasks( );
        updateSessionTasks( );
    }

    function editTask( taskDetails, uuid )
    {
        findTaskIndexByUUID( uuid );
        console.log( taskIndex );

        if ( taskIndex )
        {
            var task = tasks[ taskIndex ];
            task.taskDetails = taskDetails;
            tasks.splice( taskIndex, 1, task);
            reRenderAllTasks( );
            updateSessionTasks( );
        }
    }

    function deleteTask( uuid )
    {
        var taskIndex = findTaskIndexByUUID( uuid );

        if ( taskIndex !== null )
        {
            tasks.splice( taskIndex, 1 );
            reRenderAllTasks( );
            updateSessionTasks( );
        }
    }

    function handleTaskAddSave( )
    {
        if ( taskAddInput.value !== "" && taskAddModal._mode !== "edit" )
        {
            toggleTaskAddModal( );
            addTask( taskAddInput.value );
            taskAddInput.value = "";
        }
        else if ( taskAddInput.value !== "" && taskAddModal._mode === "edit" )
        {
            const taskIndex = findTaskIndexByUUID( taskAddModal._editUUID );
            if ( taskIndex !== null )
            {
                taskAddInput.value = tasks[ taskIndex ].taskDetails;
            }
            toggleTaskAddModal( );
            editTask( taskAddInput.value, taskAddModal._editUUID );
            taskAddModal._mode = "";
            taskAddModal._editUUID = "";
            taskAddInput.value = "";
        }
    }

    function handleTaskAddCancel( )
    {
        taskAddInput.value = "";
        toggleTaskAddModal( );
    }

    function handleInputEnter( event )
    {
        if (event.key === "Enter")
        {
            handleTaskAddSave( );
        }
    }

    function handleTaskEdit( event )
    {
        const taskEl = event.target.closest( ".js-task" );
        taskAddModal._mode = "edit";
        taskAddModal._editUUID = taskEl._UUID;
        var task = tasks[ findTaskIndexByUUID( taskEl._UUID ) ];
        taskAddInput.value = task.taskDetails;
        toggleTaskAddModal( );
    }

    function handleTaskDelete( event )
    {
        const taskEl = event.target.closest( ".js-task" );
        deleteTask(  taskEl._UUID );
    }

    function handleDocumentClick( event )
    {
        if ( !event.target.closest( ".js-task-add-modal" ) && !event.target.closest( ".js-task-add" ) && !taskAddModal.classList.contains( "opacity-0" ) )
        {
            toggleTaskAddModal( );
        }
    }

    taskAdd.addEventListener( "click", toggleTaskAddModal );
    taskAddSave.addEventListener( "click", handleTaskAddSave );
    taskAddCancel.addEventListener( "click", handleTaskAddCancel );
    taskAddInput.addEventListener( "keypress", handleInputEnter );
    document.addEventListener( "click", handleDocumentClick );
    reRenderAllTasks( );

}

function initTimerSettings( )
{
    const settingsModal = document.querySelector( ".js-settings-modal" );
    const settingsOpen = document.querySelector( ".js-settings-open" );
    const settingsClose = document.querySelector( ".js-settings-close" );
    const backdrop = document.querySelector( ".js-settings-backdrop" );
    const settingsInputs = document.querySelectorAll( ".js-settings-input" );
    const saveSettingsBtn = document.querySelector( ".js-settings-save" );

    function openSettingsModal( )
    {
        settingsModal.classList.remove( "opacity-0", "scale-70", "pointer-events-none" );
        backdrop.classList.remove( "opacity-0", "pointer-events-none", "backdrop-blur-none" );
        backdrop.classList.add( "backdrop-blur-sm" );
    }

    function closeSettingsModal( )
    {
        settingsModal.classList.add( "opacity-0", "scale-70", "pointer-events-none" );
        backdrop.classList.add( "opacity-0", "pointer-events-none", "backdrop-blur-none" );
        backdrop.classList.remove( "backdrop-blur-sm" );
    }

    function handleInputChange( )
    {
        showSaveButton( );
    }

    function readSettings( )
    {
        var timers = JSON.parse( JSON.stringify( timerConfig.timers ) );
        settingsInputs.forEach( input =>
        {
            if ( input.dataset.settingType == "timer-configs" )
            {
                var timerType = input.dataset.configType;
                var configIndex = timers.map( config => config.name ).indexOf( timerType );
                if ( configIndex !== -1 )
                {
                    timers[ configIndex ][ "timerLength" ] = parseFloat( input.value ) * 60;
                }
            }
        });

        return timers;
    }

    function getSettingsValuesFromLocal( key )
    {
        var config = JSON.parse( localStorage.timerConfig );
        if ( config[ key ] )
        {
            return config[ key ];
        }
        return null;
    }

    function resetState( timerConfigs )
    {
        timerConfig.state =
        {
            "cycle": 1,
            "mode": "pomodoro",
            "timeRemaining": timerConfigs[ 0 ].timerLength
        }
        localStorage.timerConfig = JSON.stringify( timerConfig );
    }

    function saveSettings( key, value )
    {
        if ( timerConfig[ key ] )
        {
            timerConfig[ key ] = value;
            localStorage.timerConfig = JSON.stringify( timerConfig );
        }
    }

    function reRenderSettings( )
    {
        settingsInputs.forEach( input =>
        {
            if ( input.dataset.settingType == "timer-configs" )
            {
                var settings = getSettingsValuesFromLocal( "timers" );
                var timerType = input.dataset.configType;
                var configIndex = settings.map( config => config.name ).indexOf( timerType );
                if ( configIndex !== -1 )
                {
                    input.value = parseInt( settings[ configIndex ][ "timerLength" ] ) / 60;
                }
            }
        });

        hideSaveButton( );
    }

    function showSaveButton( )
    {
        saveSettingsBtn.classList.remove( "opacity-0", "pointer-events-none", "h-0" );
        saveSettingsBtn.classList.add( "py-2" );
    }

    function hideSaveButton( )
    {
        saveSettingsBtn.classList.add( "opacity-0", "pointer-events-none", "h-0" );
        saveSettingsBtn.classList.remove( "py-2" );
    }

    function handleSaveSettingsBtn( )
    {
        var timers = readSettings( );
        saveSettings( "timers", timers );
        resetState( timers );
        reRenderSettings( );

        window.dispatchEvent( SETTINGS_CHANGE_EVENT );
    }

    settingsOpen.addEventListener( "click", openSettingsModal );
    settingsClose.addEventListener( "click", closeSettingsModal );
    backdrop.addEventListener( "click", closeSettingsModal );
    settingsInputs.forEach( input => input.addEventListener( "click", handleInputChange ) );
    saveSettingsBtn.addEventListener( "click", handleSaveSettingsBtn );

    reRenderSettings( );
}

initPomodoroTimer( );
initPomodoroTasks( );
initTimerSettings( );