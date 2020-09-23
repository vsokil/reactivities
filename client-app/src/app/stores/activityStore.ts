import { observable, action, computed, runInAction } from 'mobx'
import { SyntheticEvent } from 'react'
import { IActivity, IAttendee } from '../models/activity';
import agent from '../api/agent';
import { history } from '../..';
import { toast } from 'react-toastify';
import { RootStore } from './rootStore';
import { createAttendee, setActivityProps } from '../common/util/util';

export default class ActivityStore {
    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @observable activityRegistry = new Map();
    @observable activity: IActivity | null | undefined;
    @observable loadingInitial = false;
    @observable loading = false;
    @observable submitting = false;
    @observable target = '';

    @computed get activitiesByDate() {
        return this.groupActivitiesbyDate(Array.from(this.activityRegistry.values()));
    }

    groupActivitiesbyDate = (activities: IActivity[]) => {
        const sortedActivities = activities.sort((a, b) => a.date.getTime() - b.date.getTime());

        return Object.entries(sortedActivities.reduce((activities, activity) => {
            const date = activity.date.toISOString().split('T')[0];

            activities[date] = activities[date] ? [...activities[date], activity] : [activity];
            return activities;
        }, {} as { [key: string]: IActivity[] }));
    }

    @action loadActivities = async () => {
        this.loadingInitial = true;
        const user = this.rootStore.userStore.user;
        try {
            const activities = await agent.Activities.list();
            runInAction('loading activities', () => {
                this.loadingInitial = false;
                activities.forEach((activity) => {
                    setActivityProps(activity, user!);
                    this.activityRegistry.set(activity.id, activity);
                });
            })
        } catch (error) {
            runInAction('loading activities error', () => {
                this.loadingInitial = false;
            })
            console.log(error);
        }
    }

    @action loadActivity = async (id: string) => {
        let activity = this.getActivity(id);
        const user = this.rootStore.userStore.user;

        if (activity) {
            this.activity = activity;
            return activity;
        } else {
            this.loadingInitial = true;
            try {
                activity = await agent.Activities.details(id);
                runInAction('get activity', () => {
                    setActivityProps(activity, user!);
                    this.activity = activity;
                    this.activityRegistry.set(activity.id, activity);
                    this.loadingInitial = false;
                });
                return activity;
            }
            catch (error) {
                runInAction('get activity error', () => {
                    this.loadingInitial = false;
                });
            }
        }
    }

    @action clearActivity = () => {
        this.activity = null;
    }

    getActivity = (id: string) => {
        return this.activityRegistry.get(id);
    }

    @action createActivity = async (activity: IActivity) => {
        this.submitting = true;
        const attendee = createAttendee(this.rootStore.userStore.user!);
        attendee.isHost = true;
        let attendees: IAttendee[] = [];
        attendees.push(attendee);
        activity.attendees = attendees;
        activity.isHost = true;

        try {
            await agent.Activities.create(activity);

            runInAction('create activity', () => {
                this.activityRegistry.set(activity.id, activity);
                this.submitting = false;
            });

            history.push(`/activities/${activity.id}`);
        } catch (error) {
            runInAction('create activity error', () => {
                this.submitting = false;
            });
            toast.error('Problem submitting data');
        }
    }

    @action editActivity = async (activity: IActivity) => {
        this.submitting = true;
        try {
            await agent.Activities.update(activity);

            runInAction('edidit activity', () => {
                this.activityRegistry.set(activity.id, activity);
                this.activity = activity;
                this.submitting = false;
            });

            history.push(`/activities/${activity.id}`);
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

    @action attendActivity = async () => {
        const attendee = createAttendee(this.rootStore.userStore.user!);
        this.loading = true;

        try {
            await agent.Activities.attend(this.activity!.id);

            runInAction('attend activity', () => {
                if (this.activity) {
                    this.activity.attendees.push(attendee);
                    this.activity.isGoing = true;
                    this.activityRegistry.set(this.activity.id, this.activity);
                    this.loading = false;
                }
            })
        } catch (error) {
            runInAction(() => {
                this.loading = false;
            });
            toast.error("Problem signing up to activity")
        }
    }

    @action cancelAttendance = async () => {
        this.loading = true;

        try {
            await agent.Activities.unattend(this.activity!.id);

            runInAction('unattend activity', () => {
                if (this.activity) {
                    this.activity.attendees = this.activity.attendees.filter(a => a.userName !== this.rootStore.userStore.user!.userName);
                    this.activity.isGoing = false;
                    this.activityRegistry.set(this.activity.id, this.activity);
                    this.loading = false;
                }
            })

        } catch (error) {
            runInAction(() => {
                this.loading = false;
            })
            toast.error("Problem cancelling attendance")
        }
    }
}