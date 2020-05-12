import { observable, action, computed, configure, runInAction } from 'mobx'
import { createContext, SyntheticEvent } from 'react'
import { IActivity } from '../models/activity';
import agent from '../api/agent';

configure({ enforceActions: 'always' });

class ActivityStore {
    @observable activityRegistry = new Map();
    @observable activities: IActivity[] = [];
    @observable selectedActivity: IActivity | undefined;
    @observable loadingInitial = false;
    @observable editMode = false;
    @observable submitting = false;
    @observable target = '';

    @computed get activitiesByDate() {
        return Array.from(this.activityRegistry.values()).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    }

    @action loadActivities = async () => {
        this.loadingInitial = true;
        try {
            const activities = await agent.Activities.list();
            runInAction('loading activities', () => {
                this.loadingInitial = false;
                activities.forEach((activity) => {
                    activity.date = activity.date.split('.')[0];
                    this.activityRegistry.set(activity.id, activity);
                });
            })
        }
        catch (error) {
            runInAction('loading activities error', () => {
                this.loadingInitial = false;
            })
            console.log(error);
        }
    }

    @action selectActivity = (id: string) => {
        this.selectedActivity = this.activityRegistry.get(id);
        this.editMode = false;
    }

    @action openCreateForm = () => {
        this.selectedActivity = undefined;
        this.editMode = true;
    }

    @action openEditForm = (id: string) => {
        this.selectedActivity = this.activityRegistry.get(id);
        this.editMode = true;
    }

    @action cancelSelectedActivity = () => {
        this.selectedActivity = undefined
    }

    @action cancelFormOpen = () => {
        this.editMode = false;
    }

    @action createActivity = async (activity: IActivity) => {
        this.submitting = true;

        try {
            await agent.Activities.create(activity);

            runInAction('create activity', () => {
                this.activityRegistry.set(activity.id, activity);
                this.editMode = false;
                this.submitting = false;
            });
        } catch (error) {
            runInAction('create activity error', () => {
                this.submitting = false;
            })
            console.log(error);
        }
    }

    @action editActivity = async (activity: IActivity) => {
        this.submitting = true;
        try {
            await agent.Activities.update(activity);

            runInAction('edidit activity', () => {
                this.activityRegistry.set(activity.id, activity);
                this.selectedActivity = activity;
                this.editMode = false;
                this.submitting = false;
            });
        } catch (error) {
            runInAction('edidit activity', () => {
                this.submitting = false;
            });
            console.log(error);
        }
    }

    @action deleteActivity = async (event: SyntheticEvent<HTMLButtonElement>, id: string) => {
        this.submitting = true;
        this.target = event.currentTarget.name;
        try {
            await agent.Activities.delete(id);
            
            runInAction('delete activity', () => {
                this.activityRegistry.delete(id);
                this.submitting = false;
                this.target = '';
            });
        } catch (error) {
            runInAction('delete activity', () => {
                this.submitting = false;
            });

            console.log(error);
        }
    }
}

export default createContext(new ActivityStore())