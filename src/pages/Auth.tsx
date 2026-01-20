import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Cat, Loader2, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const authSchema = z.object({
  email: z.string().email('Ugyldig e-postadresse'),
  password: z.string().min(6, 'Passord må være minst 6 tegn'),
});

const resetSchema = z.object({
  email: z.string().email('Ugyldig e-postadresse'),
});

const newPasswordSchema = z.object({
  password: z.string().min(6, 'Passord må være minst 6 tegn'),
  confirmPassword: z.string().min(6, 'Passord må være minst 6 tegn'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passordene må være like",
  path: ["confirmPassword"],
});

type AuthFormData = z.infer<typeof authSchema>;
type ResetFormData = z.infer<typeof resetSchema>;
type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [isSettingNewPassword, setIsSettingNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  const { register: registerReset, handleSubmit: handleSubmitReset, formState: { errors: resetErrors } } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const { register: registerNewPassword, handleSubmit: handleSubmitNewPassword, formState: { errors: newPasswordErrors } } = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
  });

  // Check for password recovery event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsSettingNewPassword(true);
      }
    });

    // Also check URL hash for recovery token
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'recovery') {
      setIsSettingNewPassword(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Only redirect if user is logged in AND not in password setting mode
    if (user && !loading && !isSettingNewPassword) {
      navigate('/');
    }
  }, [user, loading, navigate, isSettingNewPassword]);

  const onSubmit = async (data: AuthFormData) => {
    setIsSubmitting(true);
    
    try {
      if (isSignUp) {
        const { error } = await signUp(data.email, data.password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Denne e-postadressen er allerede registrert. Prøv å logge inn.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Konto opprettet! Du er nå logget inn.');
        }
      } else {
        const { error } = await signIn(data.email, data.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Feil e-post eller passord');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Logget inn!');
        }
      }
    } catch (err) {
      toast.error('Noe gikk galt. Prøv igjen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResetPassword = async (data: ResetFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('E-post sendt! Sjekk innboksen din for å tilbakestille passordet.');
        setIsResetPassword(false);
      }
    } catch (err) {
      toast.error('Noe gikk galt. Prøv igjen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSetNewPassword = async (data: NewPasswordFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Passord oppdatert! Du kan nå logge inn med ditt nye passord.');
        setIsSettingNewPassword(false);
        // Clear the URL hash
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/');
      }
    } catch (err) {
      toast.error('Noe gikk galt. Prøv igjen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Set new password view (after clicking reset link)
  if (isSettingNewPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Cat className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Sett nytt passord</h1>
            <p className="text-muted-foreground">
              Skriv inn ditt nye passord nedenfor.
            </p>
          </div>

          <form onSubmit={handleSubmitNewPassword(onSetNewPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nytt passord</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••"
                  className="pl-10"
                  {...registerNewPassword('password')}
                />
              </div>
              {newPasswordErrors.password && (
                <p className="text-sm text-destructive">{newPasswordErrors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Bekreft passord</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••"
                  className="pl-10"
                  {...registerNewPassword('confirmPassword')}
                />
              </div>
              {newPasswordErrors.confirmPassword && (
                <p className="text-sm text-destructive">{newPasswordErrors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Oppdater passord
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Reset password view
  if (isResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Cat className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Glemt passord</h1>
            <p className="text-muted-foreground">
              Skriv inn e-postadressen din, så sender vi deg en lenke for å tilbakestille passordet.
            </p>
          </div>

          <form onSubmit={handleSubmitReset(onResetPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-post</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="din@epost.no"
                  className="pl-10"
                  {...registerReset('email')}
                />
              </div>
              {resetErrors.email && (
                <p className="text-sm text-destructive">{resetErrors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Send tilbakestillingslenke
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsResetPassword(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Tilbake til innlogging
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Cat className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Katteoppdrett</h1>
          <p className="text-muted-foreground">
            {isSignUp ? 'Opprett en konto' : 'Logg inn for å fortsette'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="din@epost.no"
                className="pl-10"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Passord</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                className="pl-10"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {isSignUp ? 'Opprett konto' : 'Logg inn'}
          </Button>
        </form>

        {!isSignUp && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsResetPassword(true)}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Glemt passord?
            </button>
          </div>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignUp ? 'Har du allerede en konto? Logg inn' : 'Har du ikke konto? Registrer deg'}
          </button>
        </div>
      </div>
    </div>
  );
}
